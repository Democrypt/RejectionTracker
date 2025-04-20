using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RejectionTracker.Migrations
{
    /// <inheritdoc />
    public partial class AddSideToRejectionCoordinate1 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Side",
                table: "RejectionCoordinates",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Side",
                table: "RejectionCoordinates");
        }
    }
}
