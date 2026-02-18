FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["Kumashaurma.API.csproj", "."]
RUN dotnet restore "./Kumashaurma.API.csproj"
COPY . .
WORKDIR "/src/."
RUN dotnet build "Kumashaurma.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Kumashaurma.API.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Kumashaurma.API.dll"]