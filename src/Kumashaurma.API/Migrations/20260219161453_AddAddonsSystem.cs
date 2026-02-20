using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Kumashaurma.API.Migrations
{
    /// <inheritdoc />
    public partial class AddAddonsSystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "addon_categories",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    display_order = table.Column<int>(type: "integer", nullable: false),
                    is_required = table.Column<bool>(type: "boolean", nullable: false),
                    min_selections = table.Column<int>(type: "integer", nullable: false),
                    max_selections = table.Column<int>(type: "integer", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_addon_categories", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "order_item_addons",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    order_item_id = table.Column<int>(type: "integer", nullable: false),
                    addon_id = table.Column<int>(type: "integer", nullable: false),
                    addon_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    addon_category_id = table.Column<int>(type: "integer", nullable: false),
                    addon_category_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    price = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    quantity = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_order_item_addons", x => x.id);
                    table.ForeignKey(
                        name: "FK_order_item_addons_order_items_order_item_id",
                        column: x => x.order_item_id,
                        principalTable: "order_items",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "addons",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    price = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    display_order = table.Column<int>(type: "integer", nullable: false),
                    is_available = table.Column<bool>(type: "boolean", nullable: false),
                    addon_category_id = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_addons", x => x.id);
                    table.ForeignKey(
                        name: "FK_addons_addon_categories_addon_category_id",
                        column: x => x.addon_category_id,
                        principalTable: "addon_categories",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "shawarma_addons",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    shawarma_id = table.Column<int>(type: "integer", nullable: false),
                    addon_id = table.Column<int>(type: "integer", nullable: false),
                    custom_price = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    is_default = table.Column<bool>(type: "boolean", nullable: false),
                    max_quantity = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_shawarma_addons", x => x.id);
                    table.ForeignKey(
                        name: "FK_shawarma_addons_addons_addon_id",
                        column: x => x.addon_id,
                        principalTable: "addons",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_shawarma_addons_shawarmas_shawarma_id",
                        column: x => x.shawarma_id,
                        principalTable: "shawarmas",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_addon_categories_name",
                table: "addon_categories",
                column: "name");

            migrationBuilder.CreateIndex(
                name: "IX_addons_addon_category_id",
                table: "addons",
                column: "addon_category_id");

            migrationBuilder.CreateIndex(
                name: "IX_addons_name",
                table: "addons",
                column: "name");

            migrationBuilder.CreateIndex(
                name: "IX_order_item_addons_order_item_id",
                table: "order_item_addons",
                column: "order_item_id");

            migrationBuilder.CreateIndex(
                name: "IX_shawarma_addons_addon_id",
                table: "shawarma_addons",
                column: "addon_id");

            migrationBuilder.CreateIndex(
                name: "IX_shawarma_addons_shawarma_id_addon_id",
                table: "shawarma_addons",
                columns: new[] { "shawarma_id", "addon_id" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "order_item_addons");

            migrationBuilder.DropTable(
                name: "shawarma_addons");

            migrationBuilder.DropTable(
                name: "addons");

            migrationBuilder.DropTable(
                name: "addon_categories");
        }
    }
}
