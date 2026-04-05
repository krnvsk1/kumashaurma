using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kumashaurma.API.Migrations
{
    /// <inheritdoc />
    public partial class AddPointsSystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Добавляем колонку points_balance в таблицу users
            migrationBuilder.AddColumn<int>(
                name: "points_balance",
                table: "users",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            // Создаём таблицу user_points_transactions
            migrationBuilder.CreateTable(
                name: "user_points_transactions",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", Npgsql.EntityFrameworkCore.PostgreSQL.Metadata.NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    type = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false, defaultValue: "earned"),
                    amount = table.Column<int>(type: "integer", nullable: false),
                    description = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    order_id = table.Column<int>(type: "integer", nullable: true),
                    performed_by = table.Column<int>(type: "integer", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_points_transactions", x => x.id);
                    table.ForeignKey(
                        name: "FK_user_points_transactions_users_performed_by",
                        column: x => x.performed_by,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_user_points_transactions_orders_order_id",
                        column: x => x.order_id,
                        principalTable: "orders",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_user_points_transactions_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            // Индексы
            migrationBuilder.CreateIndex(
                name: "IX_user_points_transactions_user_id",
                table: "user_points_transactions",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_user_points_transactions_order_id",
                table: "user_points_transactions",
                column: "order_id");

            migrationBuilder.CreateIndex(
                name: "IX_user_points_transactions_created_at",
                table: "user_points_transactions",
                column: "created_at");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "user_points_transactions");

            migrationBuilder.DropColumn(
                name: "points_balance",
                table: "users");
        }
    }
}
