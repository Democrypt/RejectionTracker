using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RejectionTracker.Migrations
{
    /// <inheritdoc />
    public partial class AddRejectionIdToCoordinate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RejectionCoordinates_Rejections_RejectionId",
                table: "RejectionCoordinates");

            migrationBuilder.AlterColumn<int>(
                name: "RejectionId",
                table: "RejectionCoordinates",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_RejectionCoordinates_Rejections_RejectionId",
                table: "RejectionCoordinates",
                column: "RejectionId",
                principalTable: "Rejections",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RejectionCoordinates_Rejections_RejectionId",
                table: "RejectionCoordinates");

            migrationBuilder.AlterColumn<int>(
                name: "RejectionId",
                table: "RejectionCoordinates",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddForeignKey(
                name: "FK_RejectionCoordinates_Rejections_RejectionId",
                table: "RejectionCoordinates",
                column: "RejectionId",
                principalTable: "Rejections",
                principalColumn: "Id");
        }
    }
}
