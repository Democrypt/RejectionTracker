using Microsoft.EntityFrameworkCore;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Operator> Operators { get; set; }
    public DbSet<Reason> Reasons { get; set; }
    public DbSet<Rejection> Rejections { get; set; }
    public DbSet<RejectionCoordinate> RejectionCoordinates { get; set; }
    public DbSet<GridSettings> GridSettings { get; set; }


    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Rejection>()
            .HasOne(r => r.Operator)
            .WithMany()
            .HasForeignKey(r => r.OperatorId);

        modelBuilder.Entity<RejectionCoordinate>()
            .HasOne(rc => rc.Rejection)
            .WithMany(r => r.Coordinates)
            .HasForeignKey(rc => rc.RejectionId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<RejectionCoordinate>()
            .HasOne(rc => rc.Reason)
            .WithMany()
            .HasForeignKey(rc => rc.ReasonId);
        modelBuilder.Entity<GridSettings>()
            .HasData(new GridSettings
            {
                Id = 1,
                GridCols = 15,
                GridRows = 15,
                CanvasWidth = 1000,
                CanvasHeight = 600
            });
    }
}
