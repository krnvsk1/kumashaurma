using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Kumashaurma.API.Migrations
{
    /// <inheritdoc />
    public partial class AddShawarmaHierarchyDropProductVariants : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "product_variants");

            migrationBuilder.AddColumn<int>(
                name: "parent_id",
                table: "shawarmas",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_shawarmas_parent_id",
                table: "shawarmas",
                column: "parent_id");

            migrationBuilder.AddForeignKey(
                name: "FK_shawarmas_shawarmas_parent_id",
                table: "shawarmas",
                column: "parent_id",
                principalTable: "shawarmas",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_shawarmas_shawarmas_parent_id",
                table: "shawarmas");

            migrationBuilder.DropIndex(
                name: "IX_shawarmas_parent_id",
                table: "shawarmas");

            migrationBuilder.DropColumn(
                name: "parent_id",
                table: "shawarmas");

            migrationBuilder.CreateTable(
                name: "product_variants",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    shawarma_id = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    price = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    sort_order = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_product_variants", x => x.id);
                    table.ForeignKey(
                        name: "FK_product_variants_shawarmas_shawarma_id",
                        column: x => x.shawarma_id,
                        principalTable: "shawarmas",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_product_variants_shawarma_id",
                table: "product_variants",
                column: "shawarma_id");
        }
    }
}
