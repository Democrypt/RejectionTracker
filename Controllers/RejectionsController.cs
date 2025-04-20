using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/[controller]")]
public class RejectionsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;

    public RejectionsController(AppDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    [HttpPost]
    public async Task<IActionResult> CreateRejection([FromBody] CreateRejectionRequest request)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState
                .Where(kvp => kvp.Value?.Errors?.Count > 0)
                .ToDictionary(
                    kvp => kvp.Key,
                    kvp => kvp.Value!.Errors.Select(e => e.ErrorMessage).ToArray()
                );

            return BadRequest(errors);
        }

        try
        {
            var dateUtc = DateTime.SpecifyKind(request.Date, DateTimeKind.Utc);

            // Try to find an existing rejection
            var existing = await _context.Rejections
                .FirstOrDefaultAsync(r => r.SerialNumber == request.SerialNumber && r.Date.Date == dateUtc.Date);

            if (existing != null)
            {
                // Append new coordinates
                var newCoordinates = request.Coordinates.Select(c => new RejectionCoordinate
                {
                    X = c.X,
                    Y = c.Y,
                    Side = c.Side,
                    ReasonId = c.ReasonId,
                    RejectionSerialNumber = existing.SerialNumber,
                    RejectionId = existing.Id
                }).ToList();

                _context.RejectionCoordinates.AddRange(newCoordinates);
                await _context.SaveChangesAsync();

                return Ok(new { updated = true });
            }

            // Create new rejection record
            var rejection = new Rejection
            {
                SerialNumber = request.SerialNumber,
                Date = dateUtc,
                OperatorId = request.OperatorId,
                Coordinates = request.Coordinates.Select(c => new RejectionCoordinate
                {
                    X = c.X,
                    Y = c.Y,
                    Side = c.Side,
                    ReasonId = c.ReasonId,
                    RejectionSerialNumber = request.SerialNumber
                }).ToList()
            };

            _context.Rejections.Add(rejection);
            await _context.SaveChangesAsync();

            return Ok(new { created = true });
        }
        catch (Exception ex)
        {
            Console.WriteLine("SERVER ERROR:", ex);
            return StatusCode(500, new { message = "Internal Server Error", detail = ex.Message });
        }
    }


    [HttpGet("serials")]
    public async Task<IActionResult> GetSerials()
    {
        var serials = await _context.Rejections
            .Select(r => r.SerialNumber)
            .Distinct()
            .ToListAsync();
        return Ok(serials);
    }

    [HttpGet("serial/{serialNumber}")]
    public async Task<IActionResult> GetCoordinatesForSerial(string serialNumber)
    {
        var coords = await _context.RejectionCoordinates
            .Where(c => c.RejectionSerialNumber == serialNumber)
            .ToListAsync();

        var result = coords.Select(c => new
        {
            c.X,
            c.Y,
            c.Side,
            c.ReasonId,
            Cell = GetCellPosition(c.X, c.Y)
        });

        return Ok(result);
    }

    [HttpGet("existing")]
    public async Task<IActionResult> GetExistingCoordinates([FromQuery] string serialNumber, [FromQuery] DateTime date)
    {
        var dateUtc = DateTime.SpecifyKind(date, DateTimeKind.Utc);

        var rejection = await _context.Rejections
            .Include(r => r.Coordinates)
            .FirstOrDefaultAsync(r => r.SerialNumber == serialNumber && r.Date.Date == dateUtc.Date);

        if (rejection == null)
            return Ok(new List<object>());

        var result = rejection.Coordinates.Select(c => new
        {
            c.X,
            c.Y,
            c.Side,
            c.ReasonId,
            Cell = GetCellPosition(c.X, c.Y)
        });

        return Ok(result);
    }

    [HttpGet("with-positions")]
    public async Task<IActionResult> GetCoordinatesWithCellPositions()
    {
        var coords = await _context.RejectionCoordinates.ToListAsync();
        var result = coords.Select(c => new
        {
            c.X,
            c.Y,
            c.Side,
            c.ReasonId,
            Cell = GetCellPosition(c.X, c.Y)
        });

        return Ok(result);
    }

    private string GetCellPosition(float x, float y)
    {
        using var cmd = _context.Database.GetDbConnection().CreateCommand();
        cmd.CommandText = "SELECT get_cell_position_by_pixels(@px, @py)";
        var paramX = cmd.CreateParameter();
        paramX.ParameterName = "px";
        paramX.Value = x;
        var paramY = cmd.CreateParameter();
        paramY.ParameterName = "py";
        paramY.Value = y;
        cmd.Parameters.Add(paramX);
        cmd.Parameters.Add(paramY);

        _context.Database.OpenConnection();
        var result = cmd.ExecuteScalar()?.ToString() ?? "";
        _context.Database.CloseConnection();

        return result;
    }

}
