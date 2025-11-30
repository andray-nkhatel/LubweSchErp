// ===== DATABASE INITIALIZATION SERVICE =====

using SchoolErpSMS.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace SchoolErpSMS.Services
{
    public interface IDatabaseInitializer
    {
        Task InitializeAsync();
    }

    public class DatabaseInitializer : IDatabaseInitializer
    {
        private readonly SchoolDbContext _context;
        private readonly ILogger<DatabaseInitializer> _logger;

        public DatabaseInitializer(SchoolDbContext context, ILogger<DatabaseInitializer> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task InitializeAsync()
        {
            try
            {
                // Check if database exists
                var canConnect = await _context.Database.CanConnectAsync();
                
                if (!canConnect)
                {
                    _logger.LogInformation("Database does not exist. Creating database...");
                    await _context.Database.EnsureCreatedAsync();
                }
                
                // First, check if application tables actually exist
                var tablesExist = await TableExistsAsync("Users");
                
                if (!tablesExist)
                {
                    // Tables don't exist - check if migrations table exists (orphaned from previous setup)
                    var migrationsTableExists = await TableExistsAsync("__EFMigrationsHistory");
                    
                    if (migrationsTableExists)
                    {
                        _logger.LogInformation("Migrations table exists but application tables don't. Dropping migrations table...");
                        try
                        {
                            await _context.Database.ExecuteSqlRawAsync("DROP TABLE IF EXISTS \"__EFMigrationsHistory\" CASCADE;");
                            _logger.LogInformation("Migrations table dropped.");
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning($"Could not drop migrations table: {ex.Message}. Continuing...");
                        }
                    }
                    
                    // Try migrations first, then fallback to EnsureCreated
                    try
                    {
                        _logger.LogInformation("Checking for migrations...");
                        var pendingMigrations = await _context.Database.GetPendingMigrationsAsync();
                        
                        if (pendingMigrations.Any())
                        {
                            _logger.LogInformation($"Applying {pendingMigrations.Count()} pending migration(s)...");
                            await _context.Database.MigrateAsync();
                            _logger.LogInformation("Migrations applied successfully.");
                        }
                        else
                        {
                            // No migrations available - use EnsureCreated
                            _logger.LogInformation("No migrations found. Using EnsureCreated to create database schema...");
                            
                            // Drop and recreate database to ensure clean state
                            try
                            {
                                _logger.LogInformation("Dropping existing database to ensure clean state...");
                                await _context.Database.EnsureDeletedAsync();
                                _logger.LogInformation("Database dropped. Recreating...");
                                await _context.Database.EnsureCreatedAsync();
                                _logger.LogInformation("EnsureCreated completed. Verifying tables...");
                            }
                            catch (Exception ensureEx)
                            {
                                _logger.LogError(ensureEx, $"EnsureCreated threw an exception: {ensureEx.Message}");
                                throw;
                            }
                            
                            // Verify tables were created
                            var usersTableExists = await TableExistsAsync("Users");
                            if (usersTableExists)
                            {
                                _logger.LogInformation("Database schema created successfully using EnsureCreated.");
                            }
                            else
                            {
                                throw new Exception("EnsureCreated did not create the Users table.");
                            }
                        }
                    }
                    catch (Exception migrateEx) when (migrateEx.Message.Contains("No migrations were found") || 
                                                       migrateEx.Message.Contains("No migrations"))
                    {
                        // No migrations exist - use EnsureCreated
                        _logger.LogInformation("No migrations found in assembly. Using EnsureCreated to create database schema...");
                        try
                        {
                            await _context.Database.EnsureCreatedAsync();
                        }
                        catch (Exception ensureEx)
                        {
                            _logger.LogError(ensureEx, $"EnsureCreated threw an exception: {ensureEx.Message}");
                            throw;
                        }
                        
                        // Verify creation
                        if (await TableExistsAsync("Users"))
                        {
                            _logger.LogInformation("Database schema created successfully using EnsureCreated.");
                        }
                        else
                        {
                            throw new Exception("EnsureCreated did not create the expected tables.");
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning($"Error during migration: {ex.Message}. Attempting EnsureCreated as fallback...");
                        _logger.LogError(ex, $"Full exception details: {ex}");
                        try
                        {
                            await _context.Database.EnsureCreatedAsync();
                        }
                        catch (Exception ensureEx)
                        {
                            _logger.LogError(ensureEx, $"EnsureCreated fallback threw an exception: {ensureEx.Message}");
                            throw new Exception($"EnsureCreated failed: {ensureEx.Message}", ensureEx);
                        }
                        
                        if (await TableExistsAsync("Users"))
                        {
                            _logger.LogInformation("Database schema created using EnsureCreated fallback.");
                        }
                        else
                        {
                            throw new Exception("EnsureCreated fallback failed to create tables.");
                        }
                    }
                }
                else
                {
                    // Tables exist - just check for pending migrations
                    try
                    {
                        _logger.LogInformation("Tables exist. Checking for pending migrations...");
                        var pendingMigrations = await _context.Database.GetPendingMigrationsAsync();
                        
                        if (pendingMigrations.Any())
                        {
                            _logger.LogInformation($"Applying {pendingMigrations.Count()} pending migration(s)...");
                            await _context.Database.MigrateAsync();
                            _logger.LogInformation("Migrations applied successfully.");
                        }
                        else
                        {
                            _logger.LogInformation("Database is up to date. No pending migrations.");
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning($"Error checking migrations: {ex.Message}. Database schema exists, continuing...");
                    }
                }

                _logger.LogInformation("Database initialization completed successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during database initialization");
                
                // If there's a foreign key constraint issue, log specific help
                if (ex.Message.Contains("FK_Grades_Users_HomeroomTeacherId") || ex.Message.Contains("SET NULL"))
                {
                    _logger.LogError("Foreign key constraint issue detected. Please run the following commands:");
                    _logger.LogError("1. Remove-Migration (if you have existing migrations)");
                    _logger.LogError("2. Add-Migration InitialCreate");
                    _logger.LogError("3. Update-Database");
                    _logger.LogError("Or alternatively: Drop-Database and then Update-Database");
                }
                
                throw;
            }
        }
        
        private async Task<bool> TableExistsAsync(string tableName)
        {
            try
            {
                var connection = _context.Database.GetDbConnection();
                await connection.OpenAsync();
                using var command = connection.CreateCommand();
                command.CommandText = $@"
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = 'public' 
                        AND table_name = '{tableName}'
                    )";
                var result = await command.ExecuteScalarAsync();
                await connection.CloseAsync();
                return result != null && (bool)result;
            }
            catch
            {
                return false;
            }
        }
    }
}