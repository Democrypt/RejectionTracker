using AutoMapper;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<Reason, ReasonDto>();
        CreateMap<Rejection, RejectionDto>()
            .ForMember(dest => dest.OperatorName, opt => opt.MapFrom(src => src.Operator))
            .ForMember(dest => dest.Coordinates, opt => opt.MapFrom(src => src.Coordinates));

        CreateMap<Operator, string>().ConvertUsing(op => op.Name);
        CreateMap<RejectionCoordinate, RejectionCoordinateDto>();

        CreateMap<CreateRejectionRequest, Rejection>();
    }
}
