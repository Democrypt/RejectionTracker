public class Rejection
{
    public int Id { get; set; }
    public string SerialNumber { get; set; }
    public DateTime Date { get; set; }

    public int OperatorId { get; set; }

    // ✅ required + EF-compatible
    public Operator? Operator { get; set; }

    public required ICollection<RejectionCoordinate> Coordinates { get; set; }

    // Add empty constructor for EF
    public Rejection() { }

    // Optional: helpful constructor for app-level code
    public Rejection(string serialNumber, DateTime date, int operatorId, Operator op)
    {
        SerialNumber = serialNumber;
        Date = date;
        OperatorId = operatorId;
        Operator = op;
        Coordinates = new List<RejectionCoordinate>();
    }
}
