# TaskFlow

Un orquestador web ligero y directo al grano para programar, ejecutar y monitorear scripts de Python en segundo plano. 

TaskFlow te permite olvidarte de la consola del sistema operativo o del Cron de Linux. Subís tu script, le indicás el intervalo de tiempo desde la interfaz web, y el sistema se encarga de ejecutarlo y guardar un registro detallado de cada ejecución (log).

## Características

- **Despliegue rápido:** Programá scripts recurrentes indicando solo el nombre del archivo y el intervalo en minutos.
- **Observabilidad:** Historial de logs integrado en la UI. Si un script falla, podés ver exactamente qué error tiró.
- **Ejecución aislada:** Cada tarea corre en un subproceso independiente con un timeout de seguridad de 30 segundos para evitar que el sistema se cuelgue.
- **Base de datos portable:** Usa SQLite por defecto, por lo que no requiere configuraciones complejas de bases de datos externas.

## Stack Tecnológico

- **Frontend:** React (levantado con Vite), Tailwind CSS para los estilos, y Lucide-React para la iconografía.
- **Backend:** Python con FastAPI.
- **Orquestación y Datos:** APScheduler (para el manejo de tareas de fondo) y SQLAlchemy (ORM para la persistencia en SQLite).

## Instalación y Uso

### 1. Clonar el repositorio
```bash
git clone [https://github.com/tu-usuario/taskflow.git](https://github.com/tu-usuario/taskflow.git)
cd taskflow
