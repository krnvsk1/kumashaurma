namespace Kumashaurma.API.Models
{
    public static class AppRoles
    {
        public const string User = "user";
        public const string Admin = "admin";
        public const string Manager = "manager";
        public const string Courier = "courier";

        public static readonly string[] AllRoles = { User, Admin, Manager, Courier };
    }
}
