import os
import subprocess
from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from apscheduler.schedulers.background import BackgroundScheduler
from pydantic import BaseModel 

import models
from database import engine, get_db, SessionLocal


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SCRIPTS_DIR = os.path.join(BASE_DIR, "scripts")


if not os.path.exists(SCRIPTS_DIR):
    os.makedirs(SCRIPTS_DIR)


models.Base.metadata.create_all(bind=engine)
app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

scheduler = BackgroundScheduler()


class TaskCreate(BaseModel):
    name: str
    cron: str
    script_path: str


def ejecutar_script_externo(nombre_tarea, ruta_script, tarea_id):
    db = SessionLocal()
    status = "Error"
    output = ""

    
    filename = os.path.basename(ruta_script)
    ruta_absoluta = os.path.abspath(os.path.join(SCRIPTS_DIR, filename))

    if not ruta_absoluta.startswith(SCRIPTS_DIR) or not ruta_absoluta.endswith('.py'):
        output = "❌ ERROR: Acceso denegado o archivo no permitido."
    elif not os.path.exists(ruta_absoluta):
        output = f"⚠️ Archivo no encontrado: {filename}"
    else:
        try:
            
            resultado = subprocess.run(
                ["python", ruta_absoluta], 
                capture_output=True, 
                text=True, 
                timeout=30
            )
            if resultado.returncode == 0:
                status = "Success"
                output = resultado.stdout
            else:
                output = resultado.stderr
        except subprocess.TimeoutExpired:
            output = "⏰ Error: El script tardó más de 30s."
        except Exception as e:
            output = str(e)

 
    nuevo_log = models.TaskLog(
        task_id=tarea_id,
        status=status,
        output=output[:500]
    )
    db.add(nuevo_log)
    db.commit()
    db.close()
    print(f"✅ Ejecución finalizada: {nombre_tarea} -> {status}")


@app.on_event("startup")
def start_scheduler():
    db = SessionLocal()
    try:
        tareas_activas = db.query(models.TaskModel).filter(models.TaskModel.is_active == True).all()
        for t in tareas_activas:
            scheduler.add_job(
                ejecutar_script_externo,
                'interval',
                minutes=1, 
                id=str(t.id),
                args=[t.name, t.script_path, t.id]
            )
    finally:
        db.close()
    scheduler.start()


@app.get("/")
def home():
    return {"status": "TaskFlow API Online", "scripts_folder": SCRIPTS_DIR}

@app.get("/tasks")
def listar_tareas(db: Session = Depends(get_db)):
    return db.query(models.TaskModel).all()

@app.post("/tasks")
def crear_tarea(task: TaskCreate, db: Session = Depends(get_db)):
   
    filename = os.path.basename(task.script_path)
    
    
    nueva = models.TaskModel(name=task.name, cron_expression=task.cron, script_path=filename)
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    
    
    scheduler.add_job(
        ejecutar_script_externo,
        'interval',
        minutes=1,
        id=str(nueva.id),
        args=[nueva.name, nueva.script_path, nueva.id]
    )
    return nueva

@app.delete("/tasks/{task_id}")
def eliminar_tarea(task_id: int, db: Session = Depends(get_db)):
    tarea = db.query(models.TaskModel).filter(models.TaskModel.id == task_id).first()
    if not tarea:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    
    
    try:
        scheduler.remove_job(str(task_id))
    except:
        pass
    
    db.delete(tarea)
    db.commit()
    return {"message": f"Tarea {task_id} eliminada correctamente"}

@app.get("/tasks/{task_id}/logs")
def ver_logs(task_id: int, db: Session = Depends(get_db)):
    logs = db.query(models.TaskLog).filter(models.TaskLog.task_id == task_id).order_by(models.TaskLog.execution_time.desc()).all()
    return logs
