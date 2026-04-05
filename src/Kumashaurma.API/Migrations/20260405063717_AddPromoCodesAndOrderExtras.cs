using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kumashaurma.API.Migrations
{
    /// <inheritdoc />
    public partial class AddPromoCodesAndOrderExtras : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Создаём таблицу promo_codes
            migrationBuilder.CreateTable(
                name: "promo_codes",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", Npgsql.EntityFrameworkCore.PostgreSQL.Metadata.NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    code = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    discount_type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "percent"),
                    discount_value = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    min_order_amount = table.Column<decimal>(type: "numeric(10,2)", nullable: false, defaultValue: 0m),
                    max_discount_amount = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    max_uses = table.Column<int>(type: "integer", nullable: true),
                    current_uses = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    valid_from = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    valid_until = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_by = table.Column<int>(type: "integer", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_promo_codes", x => x.id);
                    table.UniqueConstraint("AK_promo_codes_code", x => x.code);
                    table.ForeignKey(
                        name: "FK_promo_codes_users_created_by",
                        column: x => x.created_by,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            // Добавляем колонки в orders
            migrationBuilder.AddColumn<int>(
                name: "promo_code_id",
                table: "orders",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "discount_amount",
                table: "orders",
                type: "numeric(10,2)",
                nullable: false,
                defaultValue: 0m);

            // Индекс и FK для orders -> promo_codes
            migrationBuilder.CreateIndex(
                name: "IX_orders_promo_code_id",
                table: "orders",
                column: "promo_code_id");

            migrationBuilder.AddForeignKey(
                name: "FK_orders_promo_codes_promo_code_id",
                table: "orders",
                column: "promo_code_id",
                principalTable: "promo_codes",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_orders_promo_codes_promo_code_id",
                table: "orders");

            migrationBuilder.DropIndex(
                name: "IX_orders_promo_code_id",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "promo_code_id",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "discount_amount",
                table: "orders");

            migrationBuilder.DropTable(
                name: "promo_codes");
        }
    }
}
