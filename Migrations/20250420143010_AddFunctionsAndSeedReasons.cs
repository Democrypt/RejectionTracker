using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RejectionTracker.Migrations
{
    /// <inheritdoc />
    public partial class AddFunctionsAndSeedReasons : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Create PostgreSQL function
            migrationBuilder.Sql(@"
                CREATE OR REPLACE FUNCTION get_cell_position_by_pixels(x float, y float)
                RETURNS text AS $$
                DECLARE
                col int;
                row int;
                canvaswidth int;
                canvasheight int;
                BEGIN
                SELECT ""Cols"", ""Rows"", ""CanvasWidth"", ""CanvasHeight""
                INTO STRICT col, row, canvaswidth, canvasheight
                FROM ""GridSettings""
                LIMIT 1;

                RETURN chr(65 + floor(y / (canvasheight / row))::int) || 
                        (floor(x / (canvaswidth / col)) + 1)::int;
                END;
                $$ LANGUAGE plpgsql;
            ");

            // Insert reason records (if not exist)
            migrationBuilder.Sql(@"
                INSERT INTO ""Reasons"" (""Id"", ""ReasonText"", ""Color"") VALUES
                (1, 'Вылом', '#f44336'),
                (2, 'Газовая пористость', '#2196f3'),
                (3, 'Газовая раковина', '#ff9800'),
                (4, 'Газовая пузырь', '#4caf50')
                ON CONFLICT (""Id"") DO NOTHING;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP FUNCTION IF EXISTS get_cell_position_by_pixels(float, float);");
            migrationBuilder.Sql("DELETE FROM \"Reasons\" WHERE \"Id\" IN (1,2,3,4);");
        }
    }
}
