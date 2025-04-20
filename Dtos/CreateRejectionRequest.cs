public class CreateRejectionRequest
{
    public required string SerialNumber { get; set; }
    public DateTime Date { get; set; }
    public int OperatorId { get; set; }
    public required List<RejectionCoordinateDto> Coordinates { get; set; }
}