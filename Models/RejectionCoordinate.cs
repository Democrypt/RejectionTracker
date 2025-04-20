public class RejectionCoordinate
{
    public int Id { get; set; }
    public string RejectionSerialNumber { get; set; } = string.Empty;

    public float X { get; set; }
    public float Y { get; set; }
    public string Side { get; set; } = string.Empty;

    public int RejectionId { get; set; }
    public Rejection? Rejection { get; set; } 

    public int ReasonId { get; set; }

    public Reason? Reason { get; set; }

    public RejectionCoordinate() { }
}
