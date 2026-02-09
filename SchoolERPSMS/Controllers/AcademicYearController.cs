using SchoolErpSMS.DTOs;
using SchoolErpSMS.Entities;
using SchoolErpSMS.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace SchoolErpSMS.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AcademicYearsController : ControllerBase
    {
        private readonly IAcademicYearService _academicYearService;
        private readonly ILogger<AcademicYearsController> _logger;
        private readonly IWebHostEnvironment _env;

        public AcademicYearsController(
            IAcademicYearService academicYearService,
            ILogger<AcademicYearsController> logger,
            IWebHostEnvironment env)
        {
            _academicYearService = academicYearService;
            _logger = logger;
            _env = env;
        }

       
        [HttpGet]
        [Authorize(Roles = "Admin,Teacher,Staff")]
        public async Task<ActionResult<IEnumerable<AcademicYear>>> GetAcademicYears()
        {
            var academicYears = await _academicYearService.GetAllAcademicYearsAsync();
            return Ok(academicYears);
        }

      
        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,Teacher,Staff")]
        public async Task<ActionResult<AcademicYear>> GetAcademicYear(int id)
        {
            var academicYear = await _academicYearService.GetAcademicYearByIdAsync(id);
            if (academicYear == null)
                return NotFound();

            return Ok(academicYear);
        }

      
        [HttpGet("active")]
        [Authorize(Roles = "Admin,Teacher,Staff")]
        public async Task<ActionResult<AcademicYear>> GetActiveAcademicYear()
        {
            var activeYear = await _academicYearService.GetActiveAcademicYearAsync();
            if (activeYear == null)
                return NotFound();

            return Ok(activeYear);
        }

        
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<AcademicYear>> CreateAcademicYear([FromBody] CreateAcademicYearDto createAcademicYearDto)
        {
            try
            {
                if (createAcademicYearDto == null)
                    return BadRequest(new { message = "Academic year data is required" });
                if (string.IsNullOrWhiteSpace(createAcademicYearDto.Name))
                    return BadRequest(new { message = "Academic year name is required" });
                if (createAcademicYearDto.StartDate == default)
                    return BadRequest(new { message = "Start date is required" });
                if (createAcademicYearDto.EndDate == default)
                    return BadRequest(new { message = "End date is required" });

                var academicYear = new AcademicYear
                {
                    Name = createAcademicYearDto.Name.Trim(),
                    StartDate = EnsureUtc(createAcademicYearDto.StartDate),
                    EndDate = EnsureUtc(createAcademicYearDto.EndDate)
                };

                var createdYear = await _academicYearService.CreateAcademicYearAsync(academicYear);
                return CreatedAtAction(nameof(GetAcademicYear), new { id = createdYear.Id }, createdYear);
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Error creating academic year (database)");
                var message = _env.IsDevelopment()
                    ? (ex.InnerException?.Message ?? ex.Message)
                    : "A database error occurred. Check that the academic year name is unique and try again.";
                return StatusCode(500, new { message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating academic year");
                var message = _env.IsDevelopment()
                    ? (ex.InnerException?.Message ?? ex.Message)
                    : "An error occurred while creating the academic year.";
                return StatusCode(500, new { message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<AcademicYear>> UpdateAcademicYear(int id, [FromBody] UpdateAcademicYearDto dto)
        {
            if (dto == null)
                return BadRequest("Academic year data is required");
            if (string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest("Academic year name is required");

            var updated = await _academicYearService.UpdateAcademicYearAsync(id, dto.Name, EnsureUtc(dto.StartDate), EnsureUtc(dto.EndDate));
            if (updated == null)
                return NotFound();

            return Ok(updated);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> DeleteAcademicYear(int id)
        {
            try
            {
                var existingAcademicYear = await _academicYearService.GetAcademicYearByIdAsync(id);
                if (existingAcademicYear == null)
                    return NotFound();

                var success = await _academicYearService.DeleteAcademicYearAsync(id);
                if (!success)
                    return BadRequest("Failed to delete academic year");

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting academic year with ID {Id}", id);
                return StatusCode(500, "An error occurred while deleting the academic year");
            }
        }

      
        [HttpPost("{academicYearId}/close")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> CloseAcademicYear(int academicYearId)
        {
            var success = await _academicYearService.CloseAcademicYearAsync(academicYearId);
            if (!success)
                return NotFound();

            return Ok(new { message = "Academic year closed successfully" });
        }

        /// <summary>Npgsql requires UTC; treat Unspecified as UTC.</summary>
        private static DateTime EnsureUtc(DateTime value)
        {
            if (value.Kind == DateTimeKind.Utc) return value;
            if (value.Kind == DateTimeKind.Unspecified) return DateTime.SpecifyKind(value, DateTimeKind.Utc);
            return value.ToUniversalTime();
        }
    }
}