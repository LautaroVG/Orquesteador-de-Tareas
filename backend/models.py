from sqlalchemy import Column, Integer, String, DateTime, Boolean
from database import Base
import datetime

class TaskModel(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    cron_expression = Column(String)
    script_path = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class TaskLog(Base):
    __tablename__ = "task_logs"
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer)
    execution_time = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String)
    output = Column(String)    
