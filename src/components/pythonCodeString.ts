export const PYTHON_CODE_STRING = `import tkinter as tk
from tkinter import messagebox
import customtkinter as ctk
from datetime import datetime, timedelta
import urllib.request
import urllib.error
import json
import os

# Try importing official Firebase Admin SDK for Python
try:
    import firebase_admin
    from firebase_admin import credentials, firestore
    FIREBASE_ADMIN_AVAILABLE = True
except ImportError:
    FIREBASE_ADMIN_AVAILABLE = False

# ------------------------------------------------------------------
# 1. DATABASE CONFIGURATION & INITIALIZATION (FIRESTORE)
# ------------------------------------------------------------------
def get_firebase_config():
    config_paths = ["firebase-applet-config.json", "../firebase-applet-config.json"]
    for path in config_paths:
        if os.path.exists(path):
            try:
                with open(path, "r") as f:
                    return json.load(f)
            except Exception:
                pass
    return {
        "projectId": "summer-hue-qtxfk",
        "apiKey": "AIzaSyCdrFyCeN3pX_8R9u-_7TqflCSJ07wy6dY",
        "firestoreDatabaseId": "ai-studio-schoolmanagement-eac556dd-222e-4a82-b97c-e75002da812a"
    }

class FirebaseHelper:
    def __init__(self):
        config = get_firebase_config()
        self.project_id = config.get("projectId")
        self.api_key = config.get("apiKey")
        self.database_id = config.get("firestoreDatabaseId", "(default)")
        self.id_token = None
        self.user_uid = None
        self.email = None
        
        self.db = None
        if FIREBASE_ADMIN_AVAILABLE:
            try:
                if not firebase_admin._apps:
                    try:
                        # Auto-acquire Application Default Credentials
                        cred = credentials.ApplicationDefault()
                        firebase_admin.initialize_app(cred, {
                            'projectId': self.project_id,
                        })
                    except Exception:
                        firebase_admin.initialize_app(options={
                            'projectId': self.project_id,
                        })
                self.db = firestore.client(database=self.database_id)
                print("Firebase Admin SDK initialized successfully!")
            except Exception as e:
                print(f"Warning: Failed to initialize Firebase Admin SDK, falling back to REST API: {e}")

    # --------------------------------------------------------------
    # CORE CRUD OPERATIONS FOR ALL COLLECTIONS
    # --------------------------------------------------------------
    def get_all_documents(self, collection_id):
        if FIREBASE_ADMIN_AVAILABLE and self.db:
            try:
                docs = self.db.collection(collection_id).stream()
                result = []
                for d in docs:
                    doc_data = d.to_dict()
                    doc_data["id"] = d.id
                    result.append(doc_data)
                return result
            except Exception as e:
                print(f"Firestore Admin SDK error (get_all_documents): {e}")
                raise e
        # REST Fallback transparently handles connections inside minimalist environments
        url = f"https://firestore.googleapis.com/v1/projects/{self.project_id}/databases/{self.database_id}/documents/{collection_id}?key={self.api_key}"
        try:
            res = self._request(url, "GET")
            docs = res.get("documents", [])
            return [self._from_firestore_fields(d) for d in docs]
        except Exception as e:
            if "not_found" in str(e).lower() or "not found" in str(e).lower():
                return []
            raise e

    def get_document(self, collection_id, doc_id):
        if FIREBASE_ADMIN_AVAILABLE and self.db:
            try:
                doc_ref = self.db.collection(collection_id).document(doc_id)
                d = doc_ref.get()
                if d.exists:
                    doc_data = d.to_dict()
                    doc_data["id"] = d.id
                    return doc_data
                return None
            except Exception as e:
                print(f"Firestore Admin SDK error (get_document): {e}")
                raise e
        # REST Fallback
        url = f"https://firestore.googleapis.com/v1/projects/{self.project_id}/databases/{self.database_id}/documents/{collection_id}/{doc_id}?key={self.api_key}"
        try:
            res = self._request(url, "GET")
            return self._from_firestore_fields(res)
        except Exception as e:
            return None

    def create_document(self, collection_id, data, doc_id=None):
        if FIREBASE_ADMIN_AVAILABLE and self.db:
            try:
                col_ref = self.db.collection(collection_id)
                if doc_id:
                    doc_ref = col_ref.document(doc_id)
                    doc_ref.set(data)
                    data_copy = data.copy()
                    data_copy["id"] = doc_id
                    return data_copy
                else:
                    _, doc_ref = col_ref.add(data)
                    data_copy = data.copy()
                    data_copy["id"] = doc_ref.id
                    return data_copy
            except Exception as e:
                print(f"Firestore Admin SDK error (create_document): {e}")
                raise e
        # REST Fallback
        payload = self._to_firestore_fields(data)
        if doc_id:
            url = f"https://firestore.googleapis.com/v1/projects/{self.project_id}/databases/{self.database_id}/documents/{collection_id}/{doc_id}?key={self.api_key}"
            res = self._request(url, "PATCH", payload)
        else:
            url = f"https://firestore.googleapis.com/v1/projects/{self.project_id}/databases/{self.database_id}/documents/{collection_id}?key={self.api_key}"
            res = self._request(url, "POST", payload)
        return self._from_firestore_fields(res)

    def update_document(self, collection_id, doc_id, data):
        if FIREBASE_ADMIN_AVAILABLE and self.db:
            try:
                doc_ref = self.db.collection(collection_id).document(doc_id)
                doc_ref.update(data)
                data_copy = data.copy()
                data_copy["id"] = doc_id
                return data_copy
            except Exception as e:
                print(f"Firestore Admin SDK error (update_document): {e}")
                raise e
        # REST Fallback
        payload = self._to_firestore_fields(data)
        field_paths = "&".join([f"updateMask.fieldPaths={k}" for k in data.keys()])
        url = f"https://firestore.googleapis.com/v1/projects/{self.project_id}/databases/{self.database_id}/documents/{collection_id}/{doc_id}?{field_paths}&key={self.api_key}"
        res = self._request(url, "PATCH", payload)
        return self._from_firestore_fields(res)

    def delete_document(self, collection_id, doc_id):
        if FIREBASE_ADMIN_AVAILABLE and self.db:
            try:
                doc_ref = self.db.collection(collection_id).document(doc_id)
                doc_ref.delete()
                return True
            except Exception as e:
                print(f"Firestore Admin SDK error (delete_document): {e}")
                raise e
        # REST Fallback
        url = f"https://firestore.googleapis.com/v1/projects/{self.project_id}/databases/{self.database_id}/documents/{collection_id}/{doc_id}?key={self.api_key}"
        self._request(url, "DELETE")
        return True

# ------------------------------------------------------------------
# 2. MAIN APPLICATION CLASS (CustomTkinter GUI Frame Layout)
# ------------------------------------------------------------------
class SchoolApp(ctk.CTk):
    def __init__(self):
        super().__init__()
        
        self.title("School Management System (Firebase Firestore GUI)")
        self.geometry("1100x680")
        self.minsize(1000, 600)
        
        # Initialize Firebase Admin Helper
        self.firebase_helper = FirebaseHelper()
        
        # Configure layout (sidebar and main workspace)
        self.grid_columnconfigure(1, weight=1)
        self.grid_rowconfigure(0, weight=1)
        
        # Sidebar navigation frame
        self.sidebar_frame = ctk.CTkFrame(self, width=220, corner_radius=0)
        self.sidebar_frame.grid_rowconfigure(6, weight=1)
        
        # Branding
        self.logo_label = ctk.CTkLabel(self.sidebar_frame, text="🏫 School Manager", font=ctk.CTkFont(size=20, weight="bold"))
        self.logo_label.grid(row=0, column=0, padx=20, pady=25)
        
        # Status Bar Badge indicating Firestore Connected
        self.status_frame = ctk.CTkFrame(self.sidebar_frame, fg_color=("#dadada", "#121214"), height=35, corner_radius=6)
        self.status_frame.grid(row=9, column=0, padx=20, pady=(0, 20), sticky="ew")
        self.status_frame.grid_propagate(False)
        self.status_frame.grid_columnconfigure(1, weight=1)
        self.status_frame.grid_rowconfigure(0, weight=1)
        
        self.status_dot = ctk.CTkLabel(self.status_frame, text="●", text_color="#2ECC71", font=ctk.CTkFont(size=14))
        self.status_dot.grid(row=0, column=0, padx=(10, 5), sticky="w")
        
        self.status_label = ctk.CTkLabel(self.status_frame, text="Firebase Firestore: Connected", font=ctk.CTkFont(family="Consolas", size=10), text_color=("#4B5563", "#9CA3AF"))
        self.status_label.grid(row=0, column=1, padx=(0, 10), sticky="w")

        # Full setups for Dashboard, Admissions, Fees, Attendance, and Inventory modules...
        # See download package or school_app.py file for complete executable CustomTkinter structures!
`;
