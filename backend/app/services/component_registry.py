import threading

class ComponentRegistry:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(ComponentRegistry, cls).__new__(cls)
                cls._instance._registry = {}
        return cls._instance

    def register(self, comp_id: str, features: list, shape=None):
        self._registry[comp_id] = {
            "features": features,
            "shape": shape
        }

    def get(self, comp_id: str):
        return self._registry.get(comp_id)

    def remove(self, comp_id: str):
        if comp_id in self._registry:
            del self._registry[comp_id]

    def clear(self):
        self._registry.clear()

registry = ComponentRegistry()
