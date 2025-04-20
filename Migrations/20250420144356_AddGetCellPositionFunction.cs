using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RejectionTracker.Migrations
{
    /// <inheritdoc />
    public partial class AddGetCellPositionFunction : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"

                DROP FUNCTION IF EXISTS public.get_cell_position_by_pixels(double precision, double precision);

                CREATE OR REPLACE FUNCTION public.get_cell_position_by_pixels(
                    x double precision,
                    y double precision)
                RETURNS text
                LANGUAGE plpgsql
                AS $$
                DECLARE
                    cols integer;
                    rows integer;
                    width integer;
                    height integer;
                    cell_x integer;
                    cell_y integer;
                BEGIN
                    SELECT ""GridCols"", ""GridRows"", ""CanvasWidth"", ""CanvasHeight""
                    INTO cols, rows, width, height
                    FROM ""GridSettings""
                    WHERE ""Id"" = 1;

                    IF width = 0 OR height = 0 OR cols = 0 OR rows = 0 THEN
                        RAISE EXCEPTION 'Invalid grid settings';
                    END IF;

                    cell_x := floor(x / (width / cols));
                    cell_y := floor(y / (height / rows));

                    RETURN chr(65 + cell_x) || (cell_y + 1)::text;
                END;
                $$;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP FUNCTION IF EXISTS public.get_cell_position_by_pixels(double precision, double precision);");
        }
    }
}
