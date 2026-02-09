FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["src/Kumashaurma.API/Kumashaurma.API.csproj", "src/Kumashaurma.API/"]
COPY ["src/Kumashaurma.Core/Kumashaurma.Core.csproj", "src/Kumashaurma.Core/"]
RUN dotnet restore "src/Kumashaurma.API/Kumashaurma.API.csproj"
COPY . .
WORKDIR "/src/src/Kumashaurma.API"
RUN dotnet build "Kumashaurma.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Kumashaurma.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Kumashaurma.API.dll"]
