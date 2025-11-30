# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj and restore dependencies
COPY SchoolERPSMS/SchoolErpSMS.csproj SchoolERPSMS/
RUN dotnet restore SchoolERPSMS/SchoolErpSMS.csproj

# Copy everything else and build
COPY SchoolERPSMS/. SchoolERPSMS/
WORKDIR /src/SchoolERPSMS
RUN dotnet publish -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app

# Create directory for Media files
RUN mkdir -p /app/Media /app/Reports /app/logs

# Copy published files
COPY --from=build /app/publish .

# Set environment variables
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

# Expose port
EXPOSE 8080

ENTRYPOINT ["dotnet", "SchoolErpSMS.dll"]

