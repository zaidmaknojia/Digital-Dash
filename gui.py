import obd # OBD-II Library to collect data from car
import guizero # GUI for user interaction and data interpretation
connection = obd.OBD() # Auto-connects to USB-OBD Port
refresh = 100 # Refresh interval every 100 milliseconds to reduce latency when reading data

def update_RPM():
    try:
        get_RPM = round(connection.query(obd.commands.RPM).value.magnitude)
    except:
        get_RPM = float(rpm.value)

    if float(get_RPM) >= 1000:
        app.bg = 'red'
    else:
        app.bg = 'black'
    rpm.value = str("RPM: {}".format(get_RPM))

def update_Speed():
    try:
        get_Speed = round(connection.query(obd.commands.SPEED).value.to("mph").magnitude)
    except:
        get_Speed = speed.value
    speed.value = str("Speed: {}".format(get_Speed))

def update_fuel():
    try:
        get_fuel = round(connection.query(obd.commands.FUEL_LEVEL).value.magnitude)
    except:
        get_fuel = fuellvl.value
    fuellvl.value = str("Fuel: {} left".format(get_fuel))
 

app = guizero.App(width="750",height="320",bg="black")

rpm = guizero.Text(app, text="0", color="white", size=100)
rpm.repeat(100,update_RPM)

speed = guizero.Text(app, text="0", color="white", size=100)
speed.repeat(100,update_Speed)

fuellvl = guizero.Text(app, text="0", color="white", size=100)
fuellvl.repeat(5000,update_fuel)


app.display()