from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import time

router = APIRouter()

class RobotCommand(BaseModel):
    type: str
    payload: dict

# In-memory store for robot telemetry (for MVP/CLI visualization)
robot_state = {
    "status": "IDLE",
    "active_step": None,
    "logs": [],
    "event_queue": [] # List of {id, type, payload, timestamp}
}
event_counter = 0

@router.post("/telemetry")
async def update_telemetry(command: RobotCommand):
    global event_counter
    event_counter += 1
    
    event = {
        "id": event_counter,
        "type": command.type,
        "payload": command.payload,
        "timestamp": time.time()
    }
    robot_state["event_queue"].append(event)
    
    # Trim queue if too long
    if len(robot_state["event_queue"]) > 100:
        robot_state["event_queue"] = robot_state["event_queue"][-100:]
    
    if command.type == 'START_MODELING':
        robot_state["status"] = "WORKING"
        robot_state["logs"].append(f"START: {command.payload.get('name')}")
    elif command.type == 'STEP_START':
        robot_state["active_step"] = command.payload.get('step')
        robot_state["logs"].append(f"EXEC: {command.payload.get('step')}")
    elif command.type == 'STEP_SUCCESS':
        robot_state["logs"].append(f"PASS: {command.payload.get('step')}")
    elif command.type == 'STEP_ERROR':
        robot_state["status"] = "ERROR"
        robot_state["logs"].append(f"FAIL: {command.payload.get('error')}")
    elif command.type == 'FINISH':
        robot_state["status"] = "IDLE"
        robot_state["active_step"] = "COMPLETED"
        robot_state["logs"].append("FINISH")
        
    return {"status": "ok"}

@router.get("/status")
async def get_status(last_id: int = 0):
    # Return state AND new events since last_id
    new_events = [e for e in robot_state["event_queue"] if e["id"] > last_id]
    return {
        **robot_state,
        "new_events": new_events
    }
