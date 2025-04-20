using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace RejectionTracker.Migrations
{
    /// <inheritdoc />
    public partial class AddGridSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "GridSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    GridCols = table.Column<int>(type: "integer", nullable: false),
                    GridRows = table.Column<int>(type: "integer", nullable: false),
                    CanvasWidth = table.Column<int>(type: "integer", nullable: false),
                    CanvasHeight = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GridSettings", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "GridSettings",
                columns: new[] { "Id", "CanvasHeight", "CanvasWidth", "GridCols", "GridRows" },
                values: new object[] { 1, 600, 1000, 15, 15 });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GridSettings");
        }
    }
}
