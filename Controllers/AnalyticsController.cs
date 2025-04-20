using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/[controller]")]
public class AnalyticsController : ControllerBase
{
    private readonly AppDbContext _context;

    public AnalyticsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpPost("heatmap")]
    public async Task<IActionResult> GetHeatmapData([FromBody] HeatmapFilterDto filter)
    {
        if (filter == null)
            return BadRequest("Missing filter.");

        var query = _context.Rejections
            .Include(r => r.Coordinates)
            .AsQueryable();

        if (filter.From.HasValue)
        {
            var from = DateTime.SpecifyKind(filter.From.Value, DateTimeKind.Utc);
            query = query.Where(r => r.Date >= from);
        }

        if (filter.To.HasValue)
        {
            var to = DateTime.SpecifyKind(filter.To.Value, DateTimeKind.Utc);
            query = query.Where(r => r.Date <= to);
        }

        if (filter.OperatorId.HasValue)
            query = query.Where(r => r.OperatorId == filter.OperatorId.Value);

        if (!string.IsNullOrWhiteSpace(filter.SerialNumber))
            query = query.Where(r => r.SerialNumber == filter.SerialNumber);

        if (filter.ReasonId.HasValue)
        {
            query = query.Where(r => r.Coordinates.Any(c => c.ReasonId == filter.ReasonId.Value));
        }

        var coordinates = await query
            .SelectMany(r => r.Coordinates)
            .Where(c => !filter.ReasonId.HasValue || c.ReasonId == filter.ReasonId.Value) // filter reasons if set
            .Select(c => new
            {
                c.X,
                c.Y,
                c.Side,
                c.ReasonId
            })
            .ToListAsync();

        return Ok(coordinates);
    }


}
