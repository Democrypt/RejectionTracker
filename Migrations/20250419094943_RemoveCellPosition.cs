using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RejectionTracker.Migrations
{
    /// <inheritdoc />
    public partial class RemoveCellPosition : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CellPosition",
                table: "RejectionCoordinates");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CellPosition",
                table: "RejectionCoordinates",
                type: "text",
                nullable: false,
                defaultValue: "");
        }
    }
}
