FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Копируем оба csproj для кэширования nuget-пакетов
COPY ["src/Kumashaurma.API/Kumashaurma.API.csproj", "src/Kumashaurma.API/"]
COPY ["src/Kumashaurma.Core/Kumashaurma.Core.csproj", "src/Kumashaurma.Core/"]
RUN dotnet restore "src/Kumashaurma.API/Kumashaurma.API.csproj"

# Копируем весь исходный код
COPY . .
WORKDIR "/src/src/Kumashaurma.API"
RUN dotnet build "Kumashaurma.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Kumashaurma.API.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Kumashaurma.API.dll"]