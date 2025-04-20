using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/[controller]")]
public class ReasonsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ReasonsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var reasons = await _context.Reasons.ToListAsync();
        return Ok(reasons);
    }
}
