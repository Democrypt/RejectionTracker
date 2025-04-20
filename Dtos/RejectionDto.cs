public class RejectionDto
{
    public int Id { get; set; }
    public required string SerialNumber { get; set; }
    public DateTime Date { get; set; }

    public int OperatorId { get; set; }
    public required string OperatorName { get; set; }

    public required List<RejectionCoordinateDto> Coordinates { get; set; }
}
