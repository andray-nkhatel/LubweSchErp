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
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "SchoolErpSMS.dll"]
