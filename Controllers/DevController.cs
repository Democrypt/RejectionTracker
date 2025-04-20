using Microsoft.AspNetCore.Mvc;

[Route("api/dev")]
[ApiController]
public class DevController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly Random _random = new();

    public DevController(AppDbContext context)
    {
        _context = context;
    }

    [HttpPost("generate-operators")]
    public async Task<IActionResult> GenerateOperators()
    {
        var defaultNames = new[] { "Alice", "Bob", "Charlie", "Dana", "Evan" };
        var existing = _context.Operators.Select(o => o.Name).ToHashSet();

        var newOperators = defaultNames
            .Where(name => !existing.Contains(name))
            .Select(name => new Operator { Name = name })
            .ToList();

        if (newOperators.Any())
        {
            _context.Operators.AddRange(newOperators);
            await _context.SaveChangesAsync();
        }

        return Ok(new { added = newOperators.Count });
    }

    [HttpPost("generate-rejections")]
    public async Task<IActionResult> GenerateRejections()
    {
        // Clear existing data
        _context.RejectionCoordinates.RemoveRange(_context.RejectionCoordinates);
        _context.Rejections.RemoveRange(_context.Rejections);
        await _context.SaveChangesAsync();

        var reasons = _context.Reasons.ToList();
        var operators = _context.Operators.ToList();
        var serials = Enumerable.Range(1000, 10).Select(n => n.ToString()).ToList();
        var sides = new[] { "front", "back", "left", "right", "top", "bottom" };

        if (!reasons.Any() || !operators.Any())
            return BadRequest("Reasons or Operators are missing.");

        for (int i = 0; i < 7; i++)
        {
            var date = DateTime.UtcNow.Date.AddDays(-i);

            foreach (var serial in serials)
            {
                var op = operators[_random.Next(operators.Count)];

                var rejection = new Rejection
                {
                    SerialNumber = serial,
                    Date = date,
                    OperatorId = op.Id,
                    Coordinates = new List<RejectionCoordinate>()
                };

                int count = _random.Next(3, 10);
                for (int j = 0; j < count; j++)
                {
                    rejection.Coordinates.Add(new RejectionCoordinate
                    {
                        X = (float)(_random.NextDouble() * 1000),
                        Y = (float)(_random.NextDouble() * 600),
                        ReasonId = reasons[_random.Next(reasons.Count)].Id,
                        Side = sides[_random.Next(sides.Length)],
                        RejectionSerialNumber = serial
                    });
                }

                _context.Rejections.Add(rejection);
            }
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "Rejections generated" });
    }
}
