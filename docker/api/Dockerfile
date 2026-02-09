FROM mcr.microsoft.com/dotnet/sdk:9.0-alpine AS build
WORKDIR /src
COPY SchoolERPSMS/SchoolErpSMS.csproj SchoolERPSMS/
RUN dotnet restore SchoolERPSMS/SchoolErpSMS.csproj
COPY SchoolERPSMS/ SchoolERPSMS/
RUN dotnet publish SchoolERPSMS/SchoolErpSMS.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:9.0-alpine
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "SchoolErpSMS.dll"]
