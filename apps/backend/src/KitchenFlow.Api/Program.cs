var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.MapGet("/", () => "KitchenFlow API");

app.Run();
