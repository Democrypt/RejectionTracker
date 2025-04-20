using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/[controller]")]
public class GridSettingsController : ControllerBase
{
    private readonly AppDbContext _context;
    public GridSettingsController(AppDbContext context) => _context = context;

    [HttpGet]
    public async Task<IActionResult> GetSettings()
    {
        var settings = await _context.GridSettings.FirstOrDefaultAsync();
        return Ok(settings);
    }
}

