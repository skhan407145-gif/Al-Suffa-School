import tkinter as tk
from tkinter import messagebox
import customtkinter as ctk
from datetime import datetime, timedelta
import urllib.request
import urllib.error
import json
import os

# Try importing Firebase Admin SDK
try:
    import firebase_admin
    from firebase_admin import credentials, firestore
    FIREBASE_ADMIN_AVAILABLE = True
except ImportError:
    FIREBASE_ADMIN_AVAILABLE = False

# ------------------------------------------------------------------
# 1. FIREBASE & FIRESTORE HELPER
# ------------------------------------------------------------------
def get_firebase_config():
    # Try loading from the platform configuration file
    config_paths = ["firebase-applet-config.json", "../firebase-applet-config.json"]
    for path in config_paths:
        if os.path.exists(path):
            try:
                with open(path, "r") as f:
                    return json.load(f)
            except Exception:
                pass
    # Reliable fallback matching the active Firebase project ID
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
                print(f"Warning: Failed to initialize Firebase Admin SDK, falling back to REST: {e}")

    def _request(self, url, method="GET", data=None):
        headers = {
            "Content-Type": "application/json"
        }
        if self.id_token:
            headers["Authorization"] = f"Bearer {self.id_token}"
            
        req_data = None
        if data is not None:
            req_data = json.dumps(data).encode("utf-8")
            
        req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req) as response:
                return json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            err_msg = e.read().decode("utf-8")
            print(f"Firestore REST API HTTPError {e.code}: {err_msg}")
            try:
                err_json = json.loads(err_msg)
                raise Exception(err_json.get("error", {}).get("message", "Request failed"))
            except Exception:
                raise Exception(f"HTTP Error {e.code}: {e.reason}")
        except Exception as e:
            raise Exception(f"Connection failed: {str(e)}")

    def sign_in(self, email, password):
        url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={self.api_key}"
        payload = {
            "email": email,
            "password": password,
            "returnSecureToken": True
        }
        res = self._request(url, "POST", payload)
        self.id_token = res.get("idToken")
        self.user_uid = res.get("localId")
        self.email = email
        return res

    def sign_up(self, email, password):
        url = f"https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={self.api_key}"
        payload = {
            "email": email,
            "password": password,
            "returnSecureToken": True
        }
        res = self._request(url, "POST", payload)
        self.id_token = res.get("idToken")
        self.user_uid = res.get("localId")
        self.email = email
        
        # Save user to 'users' collection
        user_data = {
            "email": email,
            "role": "admin",
            "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        self.create_document("users", user_data, doc_id=self.user_uid)
        return res

    def _to_firestore_fields(self, data):
        fields = {}
        for k, v in data.items():
            if v is None:
                fields[k] = {"nullValue": None}
            elif isinstance(v, bool):
                fields[k] = {"booleanValue": v}
            elif isinstance(v, (int, float)):
                if isinstance(v, int):
                    fields[k] = {"integerValue": str(v)}
                else:
                    fields[k] = {"doubleValue": v}
            elif isinstance(v, str):
                fields[k] = {"stringValue": v}
            else:
                fields[k] = {"stringValue": str(v)}
        return {"fields": fields}

    def _from_firestore_fields(self, doc):
        doc_id = doc.get("name", "").split("/")[-1]
        fields = doc.get("fields", {})
        data = {"id": doc_id}
        for k, val_dict in fields.items():
            if "stringValue" in val_dict:
                data[k] = val_dict["stringValue"]
            elif "integerValue" in val_dict:
                data[k] = int(val_dict["integerValue"])
            elif "doubleValue" in val_dict:
                data[k] = float(val_dict["doubleValue"])
            elif "booleanValue" in val_dict:
                data[k] = val_dict["booleanValue"]
            elif "nullValue" in val_dict:
                data[k] = None
            else:
                data[k] = list(val_dict.values())[0]
        return data

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
        url = f"https://firestore.googleapis.com/v1/projects/{self.project_id}/databases/{self.database_id}/documents/{collection_id}/{doc_id}?key={self.api_key}"
        self._request(url, "DELETE")
        return True

    def seed_db(self):
        try:
            students = self.get_all_documents("students")
            if len(students) == 0:
                print("Firestore empty. Seeding primary school collections...")
                
                # 1. Seed students
                sample_students = [
                    {
                        "name": "Alex Johnson", 
                        "class_name": "Class 10-A", 
                        "roll_no": "101", 
                        "contact": "+1 (555) 123-4567",
                        "father_name": "Robert Johnson",
                        "mother_name": "Linda Johnson",
                        "guardian_name": "Robert Johnson",
                        "guardian_relation": "Father",
                        "guardian_contact": "+1 (555) 123-4567"
                    },
                    {
                        "name": "Sarah Miller", 
                        "class_name": "Class 10-A", 
                        "roll_no": "102", 
                        "contact": "+1 (555) 987-6543",
                        "father_name": "Thomas Miller",
                        "mother_name": "Susan Miller",
                        "guardian_name": "Thomas Miller",
                        "guardian_relation": "Father",
                        "guardian_contact": "+1 (555) 987-6543"
                    },
                    {
                        "name": "Ryan Davis", 
                        "class_name": "Class 9-B", 
                        "roll_no": "201", 
                        "contact": "+1 (555) 234-5678",
                        "father_name": "James Davis",
                        "mother_name": "Karen Davis",
                        "guardian_name": "James Davis",
                        "guardian_relation": "Father",
                        "guardian_contact": "+1 (555) 234-5678"
                    },
                    {
                        "name": "Emily Wilson", 
                        "class_name": "Class 9-B", 
                        "roll_no": "202", 
                        "contact": "+1 (555) 876-5432",
                        "father_name": "David Wilson",
                        "mother_name": "Helen Wilson",
                        "guardian_name": "David Wilson",
                        "guardian_relation": "Father",
                        "guardian_contact": "+1 (555) 876-5432"
                    },
                    {
                        "name": "Michael Brown", 
                        "class_name": "Class 8-C", 
                        "roll_no": "301", 
                        "contact": "+1 (555) 345-6789",
                        "father_name": "William Brown",
                        "mother_name": "Patricia Brown",
                        "guardian_name": "Patricia Brown",
                        "guardian_relation": "Mother",
                        "guardian_contact": "+1 (555) 345-6789"
                    }
                ]
                
                inserted_students = []
                for s in sample_students:
                    doc = self.create_document("students", s)
                    inserted_students.append(doc)
                
                # 2. Seed teachers (requested)
                sample_teachers = [
                    {"name": "John Doe", "subject": "Mathematics", "email": "johndoe@school.com", "contact": "+1 (555) 111-2222"},
                    {"name": "Jane Smith", "subject": "Science", "email": "janesmith@school.com", "contact": "+1 (555) 333-4444"}
                ]
                for t in sample_teachers:
                    self.create_document("teachers", t)
                    
                # 3. Seed classes (requested)
                sample_classes = [
                    {"class_name": "Class 10-A", "room_no": "Room 101", "class_teacher": "John Doe"},
                    {"class_name": "Class 9-B", "room_no": "Room 102", "class_teacher": "Jane Smith"},
                    {"class_name": "Class 8-C", "room_no": "Room 103", "class_teacher": "Unassigned"}
                ]
                for c in sample_classes:
                    self.create_document("classes", c)

                # 4. Seed fees & attendance
                current_month = datetime.now().strftime("%B %Y")
                for i, s in enumerate(inserted_students):
                    s_id = s["id"]
                    status = "Paid" if i % 2 == 0 else "Pending"
                    fee_id = f"{s_id}_{current_month}"
                    self.create_document("fees", {
                        "student_id": s_id,
                        "month": current_month,
                        "amount": 120.0,
                        "status": status
                    }, doc_id=fee_id)
                    
                    # Seed attendance for today and yesterday
                    today = datetime.now().strftime("%Y-%m-%d")
                    yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
                    att_status = "Present" if i % 4 != 3 else "Absent"
                    
                    self.create_document("attendance", {
                        "student_id": s_id,
                        "date": today,
                        "status": att_status
                    }, doc_id=f"{s_id}_{today}")
                    
                    self.create_document("attendance", {
                        "student_id": s_id,
                        "date": yesterday,
                        "status": "Present"
                    }, doc_id=f"{s_id}_{yesterday}")
                    
                # 5. Seed inventory
                sample_inventory = [
                    {"item_name": "School Blazers - Medium", "quantity": 12, "low_stock_threshold": 0, "expiry_date": ""},
                    {"item_name": "Grade 10 Math Textbook", "quantity": 45, "low_stock_threshold": 0, "expiry_date": ""},
                    {"item_name": "Science Lab Kit A", "quantity": 5, "low_stock_threshold": 0, "expiry_date": "2026-08-15"},
                    {"item_name": "First Aid Refill kit", "quantity": 15, "low_stock_threshold": 0, "expiry_date": "2026-06-01"},
                    {"item_name": "Whiteboard Markers (Box of 12)", "quantity": 30, "low_stock_threshold": 0, "expiry_date": "2027-12-31"}
                ]
                for item in sample_inventory:
                    self.create_document("inventory", item)
                    
        except Exception as e:
            print(f"Warning: Seed process encountered an issue: {e}")

# ------------------------------------------------------------------
# 2. MAIN APPLICATION CLASS
# ------------------------------------------------------------------
class SchoolApp(ctk.CTk):
    def __init__(self):
        super().__init__()
        
        self.title("School Management System (Firestore Cloud)")
        self.geometry("1100x680")
        self.minsize(1000, 600)
        
        # Initialize Firebase Helper
        self.firebase_helper = FirebaseHelper()
        
        # Configure layout (sidebar and main area)
        self.grid_columnconfigure(1, weight=1)
        self.grid_rowconfigure(0, weight=1)
        
        # Sidebar navigation frame
        self.sidebar_frame = ctk.CTkFrame(self, width=220, corner_radius=0)
        # grid() is deferred until user is successfully logged in.
        self.sidebar_frame.grid_rowconfigure(6, weight=1)
        
        # Branding Title
        self.logo_label = ctk.CTkLabel(
            self.sidebar_frame, 
            text="🏫 School Manager", 
            font=ctk.CTkFont(size=20, weight="bold")
        )
        self.logo_label.grid(row=0, column=0, padx=20, pady=25)
        
        # Sidebar Buttons
        self.btn_dashboard = ctk.CTkButton(
            self.sidebar_frame, text="📊 Dashboard", 
            command=lambda: self.select_frame("dashboard"),
            anchor="w", height=40, font=ctk.CTkFont(size=14)
        )
        self.btn_dashboard.grid(row=1, column=0, padx=20, pady=8, sticky="ew")
        
        self.btn_admission = ctk.CTkButton(
            self.sidebar_frame, text="👤 Student Admission", 
            command=lambda: self.select_frame("admission"),
            anchor="w", height=40, font=ctk.CTkFont(size=14)
        )
        self.btn_admission.grid(row=2, column=0, padx=20, pady=8, sticky="ew")
        
        self.btn_fees = ctk.CTkButton(
            self.sidebar_frame, text="💵 Fee Management", 
            command=lambda: self.select_frame("fees"),
            anchor="w", height=40, font=ctk.CTkFont(size=14)
        )
        self.btn_fees.grid(row=3, column=0, padx=20, pady=8, sticky="ew")
        
        self.btn_attendance = ctk.CTkButton(
            self.sidebar_frame, text="📅 Attendance Logger", 
            command=lambda: self.select_frame("attendance"),
            anchor="w", height=40, font=ctk.CTkFont(size=14)
        )
        self.btn_attendance.grid(row=4, column=0, padx=20, pady=8, sticky="ew")
        
        self.btn_inventory = ctk.CTkButton(
            self.sidebar_frame, text="📦 Supply Inventory", 
            command=lambda: self.select_frame("inventory"),
            anchor="w", height=40, font=ctk.CTkFont(size=14)
        )
        self.btn_inventory.grid(row=5, column=0, padx=20, pady=8, sticky="ew")
        
        # UI Theme Selector inside sidebar bottom
        self.theme_label = ctk.CTkLabel(self.sidebar_frame, text="Appearance Mode:", font=ctk.CTkFont(size=11))
        self.theme_label.grid(row=7, column=0, padx=20, pady=(10, 2))
        self.theme_optionmenu = ctk.CTkOptionMenu(
            self.sidebar_frame, values=["Dark", "Light", "System"],
            command=self.change_appearance_mode_event, height=25
        )
        self.theme_optionmenu.grid(row=8, column=0, padx=20, pady=(0, 20), sticky="ew")
        
        # Initialize Frames dictionary
        self.frames = {}
        
        # Setup specific frames
        self.setup_login_frame()
        self.setup_dashboard_frame()
        self.setup_admission_frame()
        self.setup_fees_frame()
        self.setup_attendance_frame()
        self.setup_inventory_frame()
        
        # Start at Login Flow
        self.select_frame("login")

    def change_appearance_mode_event(self, new_appearance_mode: str):
        ctk.set_appearance_mode(new_appearance_mode)

    def select_frame(self, name):
        # Hide all frames first
        for f in self.frames.values():
            f.grid_forget()
            
        if name == "login":
            self.sidebar_frame.grid_forget()
            self.frames["login"].grid(row=0, column=0, columnspan=2, padx=25, pady=25, sticky="nsew")
            return

        # Ensure sidebar is visible for normal panels
        self.sidebar_frame.grid(row=0, column=0, sticky="nsew")
        
        # Update sidebar button states to highlight selected
        self.btn_dashboard.configure(fg_color=("transparent", "transparent") if name != "dashboard" else None)
        self.btn_admission.configure(fg_color=("transparent", "transparent") if name != "admission" else None)
        self.btn_fees.configure(fg_color=("transparent", "transparent") if name != "fees" else None)
        self.btn_attendance.configure(fg_color=("transparent", "transparent") if name != "attendance" else None)
        self.btn_inventory.configure(fg_color=("transparent", "transparent") if name != "inventory" else None)
            
        # Refresh and Show the selected frame
        if name == "dashboard":
            self.refresh_dashboard()
        elif name == "admission":
            self.refresh_students_list()
        elif name == "fees":
            self.refresh_fees_view()
        elif name == "attendance":
            self.refresh_attendance_view()
        elif name == "inventory":
            self.refresh_inventory_list()
            
        self.frames[name].grid(row=0, column=1, padx=25, pady=25, sticky="nsew")

    # ------------------------------------------------------------------
    # 3. FIREBASE AUTHENTICATION FRAME
    # ------------------------------------------------------------------
    def setup_login_frame(self):
        f = ctk.CTkFrame(self, fg_color="transparent")
        self.frames["login"] = f
        f.grid_columnconfigure(0, weight=1)
        f.grid_rowconfigure(0, weight=1)
        
        card = ctk.CTkFrame(f, width=420, height=480, corner_radius=12)
        card.grid(row=0, column=0, padx=20, pady=20)
        card.grid_propagate(False)
        card.grid_columnconfigure(0, weight=1)
        
        # Title Branding
        lbl_logo = ctk.CTkLabel(card, text="🏫 School Manager Pro", font=ctk.CTkFont(size=24, weight="bold"))
        lbl_logo.pack(pady=(40, 10))
        
        lbl_sub = ctk.CTkLabel(card, text="Cloud Firebase & Firestore Login Portal", font=ctk.CTkFont(size=12), text_color="gray")
        lbl_sub.pack(pady=(0, 30))
        
        # Auth Inputs
        self.ent_login_email = ctk.CTkEntry(card, placeholder_text="Enter admin email...", width=300, height=35)
        self.ent_login_email.pack(pady=10)
        
        self.ent_login_password = ctk.CTkEntry(card, placeholder_text="Enter password...", show="*", width=300, height=35)
        self.ent_login_password.pack(pady=10)
        
        # Submit CTA
        self.btn_auth_submit = ctk.CTkButton(card, text="Sign In to System", fg_color="#1F538D", width=300, height=40, font=ctk.CTkFont(weight="bold"), command=self.auth_action)
        self.btn_auth_submit.pack(pady=(25, 10))
        
        # Toggle Auth Mode Link
        self.lbl_auth_toggle = ctk.CTkLabel(card, text="Need an admin account? Register here", text_color="#1F538D", cursor="hand2")
        self.lbl_auth_toggle.pack(pady=5)
        self.lbl_auth_toggle.bind("<Button-1>", lambda e: self.toggle_auth_mode())
        
        self.auth_mode = "signin"

    def toggle_auth_mode(self):
        if self.auth_mode == "signin":
            self.auth_mode = "signup"
            self.btn_auth_submit.configure(text="Register & Initialize Account", fg_color="#2ECC71")
            self.lbl_auth_toggle.configure(text="Already registered? Sign In instead", text_color="#2ECC71")
        else:
            self.auth_mode = "signin"
            self.btn_auth_submit.configure(text="Sign In to System", fg_color="#1F538D")
            self.lbl_auth_toggle.configure(text="Need an admin account? Register here", text_color="#1F538D")

    def auth_action(self):
        email = self.ent_login_email.get().strip()
        password = self.ent_login_password.get().strip()
        
        if not email or not password:
            messagebox.showerror("Validation Error", "Please provide both email and password credentials.")
            return
            
        self.btn_auth_submit.configure(state="disabled", text="Connecting Cloud...")
        self.update()
        
        try:
            if self.auth_mode == "signin":
                self.firebase_helper.sign_in(email, password)
                messagebox.showinfo("Welcome back", f"Authenticated successfully as:\n{email}")
            else:
                self.firebase_helper.sign_up(email, password)
                messagebox.showinfo("Account Created", f"New admin account configured successfully!")
                
            # Perform database seeding if Firestore is empty
            self.firebase_helper.seed_db()
            
            # Transition to active workspace
            self.select_frame("dashboard")
        except Exception as e:
            messagebox.showerror("Authentication Failed", f"Credentials rejected by Google Firebase:\n{str(e)}")
            self.btn_auth_submit.configure(state="normal", text="Sign In to System" if self.auth_mode == "signin" else "Register & Initialize Account")

    # ------------------------------------------------------------------
    # 4. DASHBOARD VIEW
    # ------------------------------------------------------------------
    def setup_dashboard_frame(self):
        f = ctk.CTkFrame(self, fg_color="transparent")
        self.frames["dashboard"] = f
        f.grid_columnconfigure((0, 1, 2), weight=1)
        f.grid_rowconfigure(2, weight=1)
        
        # Header
        title = ctk.CTkLabel(f, text="📊 School KPI Dashboard", font=ctk.CTkFont(size=24, weight="bold"))
        title.grid(row=0, column=0, columnspan=3, sticky="w", pady=(0, 20))
        
        # KPI Cards Frame container
        self.kpi_container = ctk.CTkFrame(f, fg_color="transparent")
        self.kpi_container.grid(row=1, column=0, columnspan=3, sticky="ew", pady=(0, 20))
        self.kpi_container.grid_columnconfigure((0, 1, 2), weight=1)
        
        # Student Count Card
        self.card_students = ctk.CTkFrame(self.kpi_container, height=100)
        self.card_students.grid(row=0, column=0, padx=10, pady=10, sticky="nsew")
        self.lbl_students_val = ctk.CTkLabel(self.card_students, text="0", font=ctk.CTkFont(size=28, weight="bold"))
        self.lbl_students_val.pack(pady=(15, 2))
        ctk.CTkLabel(self.card_students, text="Total Students", font=ctk.CTkFont(size=12, weight="normal"), text_color="gray").pack(pady=(0, 15))
        
        # Fee Collected Card
        self.card_fees = ctk.CTkFrame(self.kpi_container, height=100)
        self.card_fees.grid(row=0, column=1, padx=10, pady=10, sticky="nsew")
        self.lbl_fees_val = ctk.CTkLabel(self.card_fees, text="$0.00", font=ctk.CTkFont(size=28, weight="bold", family="Consolas"))
        self.lbl_fees_val.pack(pady=(15, 2))
        ctk.CTkLabel(self.card_fees, text="Monthly Fees Paid", font=ctk.CTkFont(size=12, weight="normal"), text_color="gray").pack(pady=(0, 15))
        
        # Attendance Today Card
        self.card_attendance = ctk.CTkFrame(self.kpi_container, height=100)
        self.card_attendance.grid(row=0, column=2, padx=10, pady=10, sticky="nsew")
        self.lbl_att_val = ctk.CTkLabel(self.card_attendance, text="100%", font=ctk.CTkFont(size=28, weight="bold"))
        self.lbl_att_val.pack(pady=(15, 2))
        ctk.CTkLabel(self.card_attendance, text="Attendance Today", font=ctk.CTkFont(size=12, weight="normal"), text_color="gray").pack(pady=(0, 15))

        # Split Details Row
        self.details_container = ctk.CTkFrame(f, fg_color="transparent")
        self.details_container.grid(row=2, column=0, columnspan=3, sticky="nsew")
        self.details_container.grid_columnconfigure(0, weight=1)
        self.details_container.grid_rowconfigure(0, weight=1)
        
        # Pending Fees Feed Card
        self.card_pending_list = ctk.CTkFrame(self.details_container)
        self.card_pending_list.grid(row=0, column=0, padx=10, pady=5, sticky="nsew")
        ctk.CTkLabel(self.card_pending_list, text="⚠️ Outstanding Fees List", font=ctk.CTkFont(size=16, weight="bold")).pack(anchor="w", padx=15, pady=10)
        self.feed_pending_scroll = ctk.CTkScrollableFrame(self.card_pending_list, height=280)
        self.feed_pending_scroll.pack(fill="both", expand=True, padx=15, pady=(0, 15))

    def refresh_dashboard(self):
        try:
            # 1. Total Students Count
            students = self.firebase_helper.get_all_documents("students")
            self.lbl_students_val.configure(text=str(len(students)))
            
            # 2. Total Monthly Fees Paid
            fees = self.firebase_helper.get_all_documents("fees")
            current_month = datetime.now().strftime("%B %Y")
            paid_amt = sum(f.get("amount", 0.0) for f in fees if f.get("month") == current_month and f.get("status") == "Paid")
            self.lbl_fees_val.configure(text=f"${paid_amt:.2f}")
            
            # 3. Attendance rate today
            attendance = self.firebase_helper.get_all_documents("attendance")
            today = datetime.now().strftime("%Y-%m-%d")
            today_att = [a for a in attendance if a.get("date") == today]
            att_total_marked = len(today_att)
            if att_total_marked > 0:
                att_present = sum(1 for a in today_att if a.get("status") == "Present")
                att_percent = int((att_present / att_total_marked) * 100)
                self.lbl_att_val.configure(text=f"{att_percent}%", text_color="white")
            else:
                self.lbl_att_val.configure(text="N/A", text_color="gray")
                
            # 4. Refresh Outstanding fees feed
            for widget in self.feed_pending_scroll.winfo_children():
                widget.destroy()
                
            pending_fees_recs = [f for f in fees if f.get("status") == "Pending"]
            student_map = {s["id"]: s for s in students}
            
            has_pending = False
            for f in pending_fees_recs:
                s_id = f.get("student_id")
                if s_id in student_map:
                    has_pending = True
                    s = student_map[s_id]
                    sname = s.get("name", "Unknown")
                    sclass = s.get("class_name", "Unknown")
                    month = f.get("month", "")
                    amt = f.get("amount", 0.0)
                    
                    fee_frame = ctk.CTkFrame(self.feed_pending_scroll, fg_color="#2a2a30", corner_radius=6)
                    fee_frame.pack(fill="x", pady=4, padx=5)
                    
                    lbl = ctk.CTkLabel(fee_frame, text=f"{sname} ({sclass})", font=ctk.CTkFont(size=12, weight="semibold"))
                    lbl.pack(side="left", padx=10, pady=8)
                    
                    lbl_amt = ctk.CTkLabel(fee_frame, text=f"${amt:.2f} [{month}]", text_color="#FF4C4C", font=ctk.CTkFont(size=11, family="Consolas"))
                    lbl_amt.pack(side="right", padx=10, pady=8)
                    
            if not has_pending:
                ctk.CTkLabel(self.feed_pending_scroll, text="All outstanding fees fully cleared!", font=ctk.CTkFont(size=12), text_color="gray").pack(pady=10)
        except Exception as e:
            messagebox.showerror("Error Loading Dashboard", f"Failed to load metrics from Firestore:\n{str(e)}")

    # ------------------------------------------------------------------
    # 5. STUDENT ADMISSION VIEW
    # ------------------------------------------------------------------
    def setup_admission_frame(self):
        f = ctk.CTkFrame(self, fg_color="transparent")
        self.frames["admission"] = f
        f.grid_columnconfigure(0, weight=2)
        f.grid_columnconfigure(1, weight=3)
        f.grid_rowconfigure(1, weight=1)
        
        # Title
        title = ctk.CTkLabel(f, text="👤 Student Admission Portal", font=ctk.CTkFont(size=24, weight="bold"))
        title.grid(row=0, column=0, columnspan=2, sticky="w", pady=(0, 20))
        
        # Left Panel: Form Frame
        form_frame = ctk.CTkFrame(f)
        form_frame.grid(row=1, column=0, padx=(0, 10), pady=5, sticky="nsew")
        form_frame.grid_columnconfigure(1, weight=1)
        
        ctk.CTkLabel(form_frame, text="Student Registration Form", font=ctk.CTkFont(size=16, weight="bold")).grid(row=0, column=0, columnspan=2, padx=15, pady=15, sticky="w")
        
        # Form inputs
        self.student_edit_id = None # Tracks if editing an existing student
        
        ctk.CTkLabel(form_frame, text="Full Name:").grid(row=1, column=0, padx=15, pady=8, sticky="w")
        self.ent_student_name = ctk.CTkEntry(form_frame, placeholder_text="e.g. Alex Johnson")
        self.ent_student_name.grid(row=1, column=1, padx=15, pady=8, sticky="ew")
        
        ctk.CTkLabel(form_frame, text="Class / Grade:").grid(row=2, column=0, padx=15, pady=8, sticky="w")
        self.ent_student_class = ctk.CTkEntry(form_frame, placeholder_text="e.g. Class 10-A")
        self.ent_student_class.grid(row=2, column=1, padx=15, pady=8, sticky="ew")
        
        ctk.CTkLabel(form_frame, text="Roll Number:").grid(row=3, column=0, padx=15, pady=8, sticky="w")
        self.ent_student_roll = ctk.CTkEntry(form_frame, placeholder_text="e.g. 101")
        self.ent_student_roll.grid(row=3, column=1, padx=15, pady=8, sticky="ew")
        
        ctk.CTkLabel(form_frame, text="Contact No:").grid(row=4, column=0, padx=15, pady=8, sticky="w")
        self.ent_student_contact = ctk.CTkEntry(form_frame, placeholder_text="e.g. +1 (555) 123-4567")
        self.ent_student_contact.grid(row=4, column=1, padx=15, pady=8, sticky="ew")

        # Nested Parent & Guardian Section Frame
        parent_section = ctk.CTkFrame(form_frame, fg_color="transparent")
        parent_section.grid(row=5, column=0, columnspan=2, padx=15, pady=(10, 5), sticky="ew")
        parent_section.grid_columnconfigure((0, 1), weight=1)

        lbl_parent_title = ctk.CTkLabel(parent_section, text="Parent & Guardian Information", font=ctk.CTkFont(size=13, weight="bold"))
        lbl_parent_title.grid(row=0, column=0, columnspan=2, sticky="w", pady=(0, 6))

        self.ent_father_name = ctk.CTkEntry(parent_section, placeholder_text="Father's Full Name")
        self.ent_father_name.grid(row=1, column=0, padx=(0, 5), pady=4, sticky="ew")

        self.ent_mother_name = ctk.CTkEntry(parent_section, placeholder_text="Mother's Full Name")
        self.ent_mother_name.grid(row=1, column=1, padx=(5, 0), pady=4, sticky="ew")

        self.ent_guardian_name = ctk.CTkEntry(parent_section, placeholder_text="Guardian's Name (Leave blank if parent)")
        self.ent_guardian_name.grid(row=2, column=0, columnspan=2, pady=4, sticky="ew")

        self.ent_guardian_relation = ctk.CTkEntry(parent_section, placeholder_text="Guardian Relation (e.g. Uncle)")
        self.ent_guardian_relation.grid(row=3, column=0, padx=(0, 5), pady=4, sticky="ew")

        self.ent_guardian_contact = ctk.CTkEntry(parent_section, placeholder_text="Guardian Contact Number")
        self.ent_guardian_contact.grid(row=3, column=1, padx=(5, 0), pady=4, sticky="ew")
        
        # Action Buttons
        btn_container = ctk.CTkFrame(form_frame, fg_color="transparent")
        btn_container.grid(row=6, column=0, columnspan=2, padx=15, pady=20, sticky="ew")
        btn_container.grid_columnconfigure((0, 1), weight=1)
        
        self.btn_save_student = ctk.CTkButton(btn_container, text="Save Student", fg_color="#1F538D", command=self.save_student_action)
        self.btn_save_student.grid(row=0, column=0, padx=(0, 5), sticky="ew")
        
        self.btn_clear_student = ctk.CTkButton(btn_container, text="Clear / New", fg_color="transparent", border_width=1, command=self.clear_student_form)
        self.btn_clear_student.grid(row=0, column=1, padx=(5, 0), sticky="ew")
        
        # Right Panel: Search & List Database Frame
        list_frame = ctk.CTkFrame(f)
        list_frame.grid(row=1, column=1, padx=(10, 0), pady=5, sticky="nsew")
        list_frame.grid_columnconfigure(0, weight=1)
        list_frame.grid_rowconfigure(2, weight=1)
        
        ctk.CTkLabel(list_frame, text="Active Student Registry", font=ctk.CTkFont(size=16, weight="bold")).grid(row=0, column=0, padx=15, pady=15, sticky="w")
        
        # Search Box
        search_container = ctk.CTkFrame(list_frame, fg_color="transparent")
        search_container.grid(row=1, column=0, padx=15, pady=(0, 10), sticky="ew")
        search_container.grid_columnconfigure(0, weight=1)
        
        self.ent_student_search = ctk.CTkEntry(search_container, placeholder_text="🔍 Search students by name or class...")
        self.ent_student_search.grid(row=0, column=0, padx=(0, 10), sticky="ew")
        self.ent_student_search.bind("<KeyRelease>", lambda e: self.refresh_students_list())
        
        # Scrollable list for student items
        self.students_list_scroll = ctk.CTkScrollableFrame(list_frame)
        self.students_list_scroll.grid(row=2, column=0, padx=15, pady=(0, 15), sticky="nsew")

    def clear_student_form(self):
        self.student_edit_id = None
        self.ent_student_name.delete(0, "end")
        self.ent_student_class.delete(0, "end")
        self.ent_student_roll.delete(0, "end")
        self.ent_student_contact.delete(0, "end")
        self.ent_father_name.delete(0, "end")
        self.ent_mother_name.delete(0, "end")
        self.ent_guardian_name.delete(0, "end")
        self.ent_guardian_relation.delete(0, "end")
        self.ent_guardian_contact.delete(0, "end")
        self.btn_save_student.configure(text="Save Student", fg_color="#1F538D")

    def save_student_action(self):
        name = self.ent_student_name.get().strip()
        class_name = self.ent_student_class.get().strip()
        roll_no = self.ent_student_roll.get().strip()
        contact = self.ent_student_contact.get().strip()
        father_name = self.ent_father_name.get().strip()
        mother_name = self.ent_mother_name.get().strip()
        guardian_name = self.ent_guardian_name.get().strip()
        guardian_relation = self.ent_guardian_relation.get().strip()
        guardian_contact = self.ent_guardian_contact.get().strip()
        
        if not name or not class_name or not roll_no:
            messagebox.showerror("Validation Error", "Name, Class, and Roll Number are required fields!")
            return
            
        try:
            student_data = {
                "name": name,
                "class_name": class_name,
                "roll_no": roll_no,
                "contact": contact,
                "father_name": father_name,
                "mother_name": mother_name,
                "guardian_name": guardian_name,
                "guardian_relation": guardian_relation,
                "guardian_contact": guardian_contact
            }
            if self.student_edit_id is None:
                self.firebase_helper.create_document("students", student_data)
                messagebox.showinfo("Success", f"Student '{name}' registered successfully!")
            else:
                self.firebase_helper.update_document("students", self.student_edit_id, student_data)
                messagebox.showinfo("Success", f"Student record updated successfully!")
                
            self.clear_student_form()
            self.refresh_students_list()
        except Exception as e:
            messagebox.showerror("Database Error", f"Error saving student to cloud:\n{str(e)}")

    def load_student_to_form(self, s):
        self.student_edit_id = s.get("id")
        self.ent_student_name.delete(0, "end")
        self.ent_student_name.insert(0, s.get("name", ""))
        self.ent_student_class.delete(0, "end")
        self.ent_student_class.insert(0, s.get("class_name", ""))
        self.ent_student_roll.delete(0, "end")
        self.ent_student_roll.insert(0, s.get("roll_no", ""))
        self.ent_student_contact.delete(0, "end")
        self.ent_student_contact.insert(0, s.get("contact", ""))
        
        self.ent_father_name.delete(0, "end")
        self.ent_father_name.insert(0, s.get("father_name", ""))
        self.ent_mother_name.delete(0, "end")
        self.ent_mother_name.insert(0, s.get("mother_name", ""))
        self.ent_guardian_name.delete(0, "end")
        self.ent_guardian_name.insert(0, s.get("guardian_name", ""))
        self.ent_guardian_relation.delete(0, "end")
        self.ent_guardian_relation.insert(0, s.get("guardian_relation", ""))
        self.ent_guardian_contact.delete(0, "end")
        self.ent_guardian_contact.insert(0, s.get("guardian_contact", ""))
        
        self.btn_save_student.configure(text="Update Record", fg_color="#2ECC71")

    def delete_student_action(self, s_id, name):
        if messagebox.askyesno("Confirm Deletion", f"Are you sure you want to delete student '{name}' and all associated records?"):
            try:
                # 1. Delete student document
                self.firebase_helper.delete_document("students", s_id)
                
                # 2. Cascade delete fees
                fees = self.firebase_helper.get_all_documents("fees")
                for f in fees:
                    if f.get("student_id") == s_id:
                        self.firebase_helper.delete_document("fees", f["id"])
                        
                # 3. Cascade delete attendance
                attendance = self.firebase_helper.get_all_documents("attendance")
                for a in attendance:
                    if a.get("student_id") == s_id:
                        self.firebase_helper.delete_document("attendance", a["id"])
                        
                messagebox.showinfo("Success", "Student records cleared from Cloud successfully.")
                self.clear_student_form()
                self.refresh_students_list()
            except Exception as e:
                messagebox.showerror("Error", f"Failed to delete cloud records:\n{str(e)}")

    def refresh_students_list(self):
        # Destroy current list elements
        for widget in self.students_list_scroll.winfo_children():
            widget.destroy()
            
        search_term = self.ent_student_search.get().strip().lower()
        
        try:
            students = self.firebase_helper.get_all_documents("students")
            
            # Client-side search matching SQL 'LIKE %term%'
            if search_term:
                students = [s for s in students if search_term in s.get("name", "").lower() or search_term in s.get("class_name", "").lower()]
                
            # Sort by class then name
            students.sort(key=lambda s: (s.get("class_name", ""), s.get("name", "")))
            
            if not students:
                ctk.CTkLabel(self.students_list_scroll, text="No students found matching search.", text_color="gray").pack(pady=20)
                return
                
            for s in students:
                s_id = s["id"]
                name = s.get("name", "")
                class_name = s.get("class_name", "")
                roll_no = s.get("roll_no", "")
                contact = s.get("contact", "")
                father_name = s.get("father_name", "")
                mother_name = s.get("mother_name", "")
                guardian_name = s.get("guardian_name", "")
                guardian_relation = s.get("guardian_relation", "")
                guardian_contact = s.get("guardian_contact", "")
                
                # Row Container
                row_frame = ctk.CTkFrame(self.students_list_scroll, fg_color="#2a2a30", corner_radius=6)
                row_frame.pack(fill="x", pady=5, padx=5)
                
                # Details block
                details_str = f"👤 {name}\n📍 {class_name} | Roll No: {roll_no} | 📞 {contact if contact else 'N/A'}"
                if father_name or mother_name or guardian_name:
                    parents_list = []
                    if father_name:
                        parents_list.append(f"Father: {father_name}")
                    if mother_name:
                        parents_list.append(f"Mother: {mother_name}")
                    if guardian_name:
                        rel_suffix = f" ({guardian_relation})" if guardian_relation else ""
                        parents_list.append(f"Guardian: {guardian_name}{rel_suffix}")
                    details_str += "\n👨‍👩‍👧 Parents: " + " | ".join(parents_list)
                    if guardian_contact:
                        details_str += f" (Emergency: {guardian_contact})"

                lbl = ctk.CTkLabel(row_frame, text=details_str, justify="left", font=ctk.CTkFont(size=11))
                lbl.pack(side="left", padx=15, pady=8)
                
                # Right side actions
                action_container = ctk.CTkFrame(row_frame, fg_color="transparent")
                action_container.pack(side="right", padx=10)
                
                btn_edit = ctk.CTkButton(
                    action_container, text="✏️ Edit", width=60, height=26, fg_color="#34495E",
                    command=lambda s_dict=s: self.load_student_to_form(s_dict)
                )
                btn_edit.pack(side="left", padx=3)
                
                btn_del = ctk.CTkButton(
                    action_container, text="🗑️ Delete", width=65, height=26, fg_color="#C0392B", hover_color="#922B21",
                    command=lambda sid=s_id, n=name: self.delete_student_action(sid, n)
                )
                btn_del.pack(side="left", padx=3)
        except Exception as e:
            messagebox.showerror("Error", f"Failed to refresh student list from Firestore:\n{str(e)}")

    # ------------------------------------------------------------------
    # 6. FEE MANAGEMENT VIEW
    # ------------------------------------------------------------------
    def setup_fees_frame(self):
        f = ctk.CTkFrame(self, fg_color="transparent")
        self.frames["fees"] = f
        f.grid_columnconfigure(0, weight=1)
        f.grid_rowconfigure(2, weight=1)
        
        title = ctk.CTkLabel(f, text="💵 Monthly Fee Management Portal", font=ctk.CTkFont(size=24, weight="bold"))
        title.grid(row=0, column=0, sticky="w", pady=(0, 20))
        
        # Config Section: Select Month & Add Custom Amount
        config_frame = ctk.CTkFrame(f)
        config_frame.grid(row=1, column=0, pady=(0, 15), sticky="ew")
        
        ctk.CTkLabel(config_frame, text="Billing Cycle:").grid(row=0, column=0, padx=15, pady=15, sticky="w")
        
        current_year = datetime.now().year
        self.months_list = [f"{m} {current_year}" for m in ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]]
        
        self.opt_fee_month = ctk.CTkOptionMenu(
            config_frame, values=self.months_list,
            command=lambda e: self.refresh_fees_view()
        )
        self.opt_fee_month.set(datetime.now().strftime("%B %Y"))
        self.opt_fee_month.grid(row=0, column=1, padx=10, pady=15, sticky="w")
        
        # Default Fee Amount Setter
        ctk.CTkLabel(config_frame, text="Billing Value:").grid(row=0, column=2, padx=(20, 5), pady=15, sticky="w")
        self.ent_fee_value = ctk.CTkEntry(config_frame, placeholder_text="e.g. 120.00", width=100)
        self.ent_fee_value.insert(0, "120.00")
        self.ent_fee_value.grid(row=0, column=3, padx=10, pady=15, sticky="w")
        
        # Filter Class
        ctk.CTkLabel(config_frame, text="Class filter:").grid(row=0, column=4, padx=(20, 5), pady=15, sticky="w")
        self.ent_fee_class_filter = ctk.CTkEntry(config_frame, placeholder_text="All classes", width=120)
        self.ent_fee_class_filter.grid(row=0, column=5, padx=10, pady=15, sticky="w")
        self.ent_fee_class_filter.bind("<KeyRelease>", lambda e: self.refresh_fees_view())
        
        # Summary Area Block
        self.lbl_fees_summary = ctk.CTkLabel(config_frame, text="Total: -- | Paid: -- | Pending: --", font=ctk.CTkFont(size=13, weight="bold"))
        self.lbl_fees_summary.grid(row=0, column=6, padx=(30, 15), pady=15, sticky="e")
        config_frame.grid_columnconfigure(6, weight=1)
        
        # Scrollable Fee Grid List
        self.fees_grid_scroll = ctk.CTkScrollableFrame(f)
        self.fees_grid_scroll.grid(row=2, column=0, sticky="nsew")

    def toggle_fee_status(self, student_id, month, current_status):
        new_status = "Paid" if current_status == "Pending" else "Pending"
        amt_str = self.ent_fee_value.get().strip()
        try:
            amt = float(amt_str)
        except ValueError:
            amt = 120.0 # Default fallback
            
        try:
            fee_id = f"{student_id}_{month}"
            self.firebase_helper.create_document("fees", {
                "student_id": student_id,
                "month": month,
                "amount": amt,
                "status": new_status
            }, doc_id=fee_id)
            self.refresh_fees_view()
        except Exception as e:
            messagebox.showerror("Error", f"Failed to update fee on Cloud:\n{str(e)}")

    def refresh_fees_view(self):
        for widget in self.fees_grid_scroll.winfo_children():
            widget.destroy()
            
        selected_month = self.opt_fee_month.get()
        class_filter = self.ent_fee_class_filter.get().strip().lower()
        
        try:
            students = self.firebase_helper.get_all_documents("students")
            if class_filter:
                students = [s for s in students if class_filter in s.get("class_name", "").lower()]
                
            students.sort(key=lambda s: (s.get("class_name", ""), s.get("name", "")))
            
            if not students:
                ctk.CTkLabel(self.fees_grid_scroll, text="No active students found in student registry matching class filter.", text_color="gray").pack(pady=25)
                self.lbl_fees_summary.configure(text="Paid: $0.00 | Pending: $0.00")
                return
                
            total_paid_accum = 0.0
            total_pending_accum = 0.0
            
            # Table Header
            header_frame = ctk.CTkFrame(self.fees_grid_scroll, fg_color="#1E272C", corner_radius=4)
            header_frame.pack(fill="x", pady=(0, 10), padx=5)
            ctk.CTkLabel(header_frame, text="STUDENT NAME & CLASS", font=ctk.CTkFont(size=11, weight="bold"), text_color="gray").pack(side="left", padx=15, pady=5)
            ctk.CTkLabel(header_frame, text="FEE BILL ACTION", font=ctk.CTkFont(size=11, weight="bold"), text_color="gray").pack(side="right", padx=30, pady=5)
            
            fees = self.firebase_helper.get_all_documents("fees")
            fee_map = {f["id"]: f for f in fees}
            
            for s in students:
                s_id = s["id"]
                sname = s.get("name", "")
                sclass = s.get("class_name", "")
                roll = s.get("roll_no", "")
                
                # Check existing record on Firestore
                fee_id = f"{s_id}_{selected_month}"
                fee_rec = fee_map.get(fee_id)
                
                amt_to_display = 120.0
                if fee_rec:
                    amt_to_display = fee_rec.get("amount", 120.0)
                    status = fee_rec.get("status", "Pending")
                else:
                    status = "Pending"
                    try:
                        amt_to_display = float(self.ent_fee_value.get().strip())
                    except ValueError:
                        pass
                        
                if status == "Paid":
                    total_paid_accum += amt_to_display
                    badge_bg = "#2ECC71"
                    action_text = "💰 Paid - Click to Undo"
                else:
                    total_pending_accum += amt_to_display
                    badge_bg = "#E74C3C"
                    action_text = "⚠️ Pending - Click to Pay"
                    
                row_frame = ctk.CTkFrame(self.fees_grid_scroll, fg_color="#2a2a30", corner_radius=6)
                row_frame.pack(fill="x", pady=4, padx=5)
                
                # Label
                lbl_desc = ctk.CTkLabel(row_frame, text=f"👤 {sname} ({sclass}) - Roll No: {roll}", font=ctk.CTkFont(size=12, weight="semibold"))
                lbl_desc.pack(side="left", padx=15, pady=8)
                
                # Action controls container
                actions = ctk.CTkFrame(row_frame, fg_color="transparent")
                actions.pack(side="right", padx=10)
                
                # Display current bill amount
                lbl_amt = ctk.CTkLabel(actions, text=f"${amt_to_display:.2f}", font=ctk.CTkFont(family="Consolas", size=12, weight="bold"))
                lbl_amt.pack(side="left", padx=15)
                
                btn_status = ctk.CTkButton(
                    actions, text=action_text, fg_color=badge_bg, hover_color="#2E4053", text_color="white", width=180, height=28,
                    command=lambda sid=s_id, m=selected_month, st=status: self.toggle_fee_status(sid, m, st)
                )
                btn_status.pack(side="left", padx=5)
                
            # Update billing summary text
            self.lbl_fees_summary.configure(
                text=f"Total: ${total_paid_accum+total_pending_accum:.2f} | Paid: ${total_paid_accum:.2f} | Pending: ${total_pending_accum:.2f}",
                text_color="#2ECC71" if total_pending_accum == 0 else "#FF7675"
            )
        except Exception as e:
            messagebox.showerror("Error", f"Failed to retrieve fee records from Cloud:\n{str(e)}")

    # ------------------------------------------------------------------
    # 7. ATTENDANCE LOGGER VIEW
    # ------------------------------------------------------------------
    def setup_attendance_frame(self):
        f = ctk.CTkFrame(self, fg_color="transparent")
        self.frames["attendance"] = f
        f.grid_columnconfigure(0, weight=1)
        f.grid_rowconfigure(2, weight=1)
        
        title = ctk.CTkLabel(f, text="📅 Daily Attendance Ledger", font=ctk.CTkFont(size=24, weight="bold"))
        title.grid(row=0, column=0, sticky="w", pady=(0, 20))
        
        # Date & Filter controls
        ctrl_frame = ctk.CTkFrame(f)
        ctrl_frame.grid(row=1, column=0, pady=(0, 15), sticky="ew")
        
        ctk.CTkLabel(ctrl_frame, text="Attendance Date:").grid(row=0, column=0, padx=15, pady=15, sticky="w")
        self.ent_att_date = ctk.CTkEntry(ctrl_frame, width=120)
        self.ent_att_date.insert(0, datetime.now().strftime("%Y-%m-%d"))
        self.ent_att_date.grid(row=0, column=1, padx=10, pady=15, sticky="w")
        
        ctk.CTkLabel(ctrl_frame, text="Class / Grade:").grid(row=0, column=2, padx=(20, 5), pady=15, sticky="w")
        self.ent_att_class = ctk.CTkEntry(ctrl_frame, placeholder_text="e.g. Class 10-A", width=120)
        self.ent_att_class.grid(row=0, column=3, padx=10, pady=15, sticky="w")
        
        # Retrieve trigger button
        btn_load_att = ctk.CTkButton(ctrl_frame, text="🔍 Load Sheet", width=100, command=self.refresh_attendance_view)
        btn_load_att.grid(row=0, column=4, padx=10, pady=15, sticky="w")
        
        # Batch buttons
        btn_all_present = ctk.CTkButton(ctrl_frame, text="✅ All Present", fg_color="#2ECC71", width=100, command=lambda: self.set_batch_attendance("Present"))
        btn_all_present.grid(row=0, column=5, padx=5, pady=15, sticky="w")
        
        btn_all_absent = ctk.CTkButton(ctrl_frame, text="❌ All Absent", fg_color="#E74C3C", width=100, command=lambda: self.set_batch_attendance("Absent"))
        btn_all_absent.grid(row=0, column=6, padx=5, pady=15, sticky="w")
        
        # Grid scroll sheet
        self.att_grid_scroll = ctk.CTkScrollableFrame(f)
        self.att_grid_scroll.grid(row=2, column=0, sticky="nsew")
        
        # Save Trigger
        self.btn_save_attendance = ctk.CTkButton(f, text="💾 Save Marked Attendance Sheet", fg_color="#1F538D", height=45, command=self.save_attendance_sheet)
        self.btn_save_attendance.grid(row=3, column=0, pady=(15, 0), sticky="ew")

    def set_batch_attendance(self, status):
        if hasattr(self, 'attendance_vars'):
            for var in self.attendance_vars.values():
                var.set(status)

    def refresh_attendance_view(self):
        # Clear children
        for widget in self.att_grid_scroll.winfo_children():
            widget.destroy()
            
        target_class = self.ent_att_class.get().strip()
        target_date = self.ent_att_date.get().strip()
        
        if not target_class:
            ctk.CTkLabel(self.att_grid_scroll, text="Please specify a class (e.g. 'Class 10-A') to load student attendance sheet.", text_color="gray").pack(pady=35)
            return
            
        try:
            students = self.firebase_helper.get_all_documents("students")
            students = [s for s in students if s.get("class_name", "").lower() == target_class.lower()]
            
            if not students:
                ctk.CTkLabel(self.att_grid_scroll, text=f"No students found registered under class '{target_class}'. Verify spelling in Admission Portal.", text_color="gray").pack(pady=35)
                return
                
            students.sort(key=lambda s: s.get("roll_no", ""))
            
            self.attendance_vars = {} # Dictionary to store StringVar statuses mapped to student IDs
            
            # Sheet header
            header_frame = ctk.CTkFrame(self.att_grid_scroll, fg_color="#1E272C", corner_radius=4)
            header_frame.pack(fill="x", pady=(0, 10), padx=5)
            ctk.CTkLabel(header_frame, text="ROLL & STUDENT NAME", font=ctk.CTkFont(size=11, weight="bold"), text_color="gray").pack(side="left", padx=15, pady=5)
            ctk.CTkLabel(header_frame, text="STATUS MARKER", font=ctk.CTkFont(size=11, weight="bold"), text_color="gray").pack(side="right", padx=60, pady=5)
            
            attendance = self.firebase_helper.get_all_documents("attendance")
            att_map = {a["id"]: a for a in attendance}
            
            for s in students:
                s_id = s["id"]
                sname = s.get("name", "")
                roll = s.get("roll_no", "")
                
                # Check existing status on Firestore
                att_id = f"{s_id}_{target_date}"
                rec = att_map.get(att_id)
                existing_status = rec.get("status", "Present") if rec else "Present"
                
                var = tk.StringVar(value=existing_status)
                self.attendance_vars[s_id] = var
                
                row_frame = ctk.CTkFrame(self.att_grid_scroll, fg_color="#2a2a30", corner_radius=6)
                row_frame.pack(fill="x", pady=4, padx=5)
                
                lbl = ctk.CTkLabel(row_frame, text=f"#{roll}  |  {sname}", font=ctk.CTkFont(size=12, weight="bold"))
                lbl.pack(side="left", padx=15, pady=8)
                
                # Selector switches segment in tkinter
                sw_container = ctk.CTkFrame(row_frame, fg_color="transparent")
                sw_container.pack(side="right", padx=20)
                
                rad_present = ctk.CTkRadioButton(sw_container, text="Present", variable=var, value="Present", fg_color="#2ECC71", hover_color="#27AE60")
                rad_present.pack(side="left", padx=15)
                
                rad_absent = ctk.CTkRadioButton(sw_container, text="Absent", variable=var, value="Absent", fg_color="#E74C3C", hover_color="#C0392B")
                rad_absent.pack(side="left", padx=15)
        except Exception as e:
            messagebox.showerror("Error", f"Failed to retrieve attendance ledger from Cloud:\n{str(e)}")

    def save_attendance_sheet(self):
        if not hasattr(self, 'attendance_vars') or not self.attendance_vars:
            messagebox.showerror("Sheet Error", "No attendance sheet loaded. Please load a class sheet first.")
            return
            
        target_date = self.ent_att_date.get().strip()
        try:
            datetime.strptime(target_date, "%Y-%m-%d")
        except ValueError:
            messagebox.showerror("Validation Error", "Invalid date format! Use YYYY-MM-DD")
            return
            
        try:
            for s_id, var in self.attendance_vars.items():
                status = var.get()
                att_id = f"{s_id}_{target_date}"
                self.firebase_helper.create_document("attendance", {
                    "student_id": s_id,
                    "date": target_date,
                    "status": status
                }, doc_id=att_id)
            messagebox.showinfo("Success", f"Attendance sheet for {target_date} synchronized with Cloud successfully!")
        except Exception as e:
            messagebox.showerror("Database Error", f"Failed to commit attendance sheet to Cloud:\n{str(e)}")

    # ------------------------------------------------------------------
    # 8. INVENTORY VIEW
    # ------------------------------------------------------------------
    def setup_inventory_frame(self):
        f = ctk.CTkFrame(self, fg_color="transparent")
        self.frames["inventory"] = f
        f.grid_columnconfigure(0, weight=2)
        f.grid_columnconfigure(1, weight=3)
        f.grid_rowconfigure(1, weight=1)
        
        # Title
        title = ctk.CTkLabel(f, text="📦 School Supplies & Expiry Tracker", font=ctk.CTkFont(size=24, weight="bold"))
        title.grid(row=0, column=0, columnspan=2, sticky="w", pady=(0, 20))
        
        # Left Panel: Add/Edit Form Frame
        form_frame = ctk.CTkFrame(f)
        form_frame.grid(row=1, column=0, padx=(0, 10), pady=5, sticky="nsew")
        form_frame.grid_columnconfigure(1, weight=1)
        
        ctk.CTkLabel(form_frame, text="Supply Entry Form", font=ctk.CTkFont(size=16, weight="bold")).grid(row=0, column=0, columnspan=2, padx=15, pady=15, sticky="w")
        
        self.inventory_edit_id = None
        
        ctk.CTkLabel(form_frame, text="Item Name:").grid(row=1, column=0, padx=15, pady=8, sticky="w")
        self.ent_inv_name = ctk.CTkEntry(form_frame, placeholder_text="e.g. Science Lab Kit A")
        self.ent_inv_name.grid(row=1, column=1, padx=15, pady=8, sticky="ew")
        
        ctk.CTkLabel(form_frame, text="Stock Quantity:").grid(row=2, column=0, padx=15, pady=8, sticky="w")
        self.ent_inv_qty = ctk.CTkEntry(form_frame, placeholder_text="e.g. 10")
        self.ent_inv_qty.grid(row=2, column=1, padx=15, pady=8, sticky="ew")
        
        ctk.CTkLabel(form_frame, text="Expiry/Renewal Date:").grid(row=3, column=0, padx=15, pady=8, sticky="w")
        self.ent_inv_expiry = ctk.CTkEntry(form_frame, placeholder_text="YYYY-MM-DD (Optional)")
        self.ent_inv_expiry.grid(row=3, column=1, padx=15, pady=8, sticky="ew")
        
        # Form buttons
        btn_container = ctk.CTkFrame(form_frame, fg_color="transparent")
        btn_container.grid(row=4, column=0, columnspan=2, padx=15, pady=25, sticky="ew")
        btn_container.grid_columnconfigure((0, 1), weight=1)
        
        self.btn_save_inv = ctk.CTkButton(btn_container, text="Save Supply Item", fg_color="#1F538D", command=self.save_inventory_action)
        self.btn_save_inv.grid(row=0, column=0, padx=(0, 5), sticky="ew")
        
        self.btn_clear_inv = ctk.CTkButton(btn_container, text="Clear Form", fg_color="transparent", border_width=1, command=self.clear_inventory_form)
        self.btn_clear_inv.grid(row=0, column=1, padx=(5, 0), sticky="ew")
        
        # Right Panel: Table Frame
        list_frame = ctk.CTkFrame(f)
        list_frame.grid(row=1, column=1, padx=(10, 0), pady=5, sticky="nsew")
        list_frame.grid_columnconfigure(0, weight=1)
        list_frame.grid_rowconfigure(1, weight=1)
        
        ctk.CTkLabel(list_frame, text="Current Supplies Ledger", font=ctk.CTkFont(size=16, weight="bold")).grid(row=0, column=0, padx=15, pady=15, sticky="w")
        
        # Scrollable list for stock list
        self.inventory_scroll = ctk.CTkScrollableFrame(list_frame)
        self.inventory_scroll.grid(row=1, column=0, padx=15, pady=(0, 15), sticky="nsew")

    def clear_inventory_form(self):
        self.inventory_edit_id = None
        self.ent_inv_name.delete(0, "end")
        self.ent_inv_qty.delete(0, "end")
        self.ent_inv_expiry.delete(0, "end")
        self.btn_save_inv.configure(text="Save Supply Item", fg_color="#1F538D")

    def save_inventory_action(self):
        name = self.ent_inv_name.get().strip()
        qty_str = self.ent_inv_qty.get().strip()
        expiry = self.ent_inv_expiry.get().strip()
        
        if not name or not qty_str:
            messagebox.showerror("Validation Error", "Item Name and Quantity are required fields.")
            return
            
        try:
            qty = int(qty_str)
        except ValueError:
            messagebox.showerror("Validation Error", "Quantity must be a positive whole number.")
            return
            
        if expiry:
            try:
                datetime.strptime(expiry, "%Y-%m-%d")
            except ValueError:
                messagebox.showerror("Validation Error", "Expiry Date format must be YYYY-MM-DD!")
                return
                
        try:
            inv_data = {
                "item_name": name,
                "quantity": qty,
                "low_stock_threshold": 0,
                "expiry_date": expiry if expiry else ""
            }
            if self.inventory_edit_id is None:
                self.firebase_helper.create_document("inventory", inv_data)
                messagebox.showinfo("Success", f"Inventory item '{name}' logged successfully!")
            else:
                self.firebase_helper.update_document("inventory", self.inventory_edit_id, inv_data)
                messagebox.showinfo("Success", f"Inventory item details updated successfully!")
                
            self.clear_inventory_form()
            self.refresh_inventory_list()
        except Exception as e:
            messagebox.showerror("Database Error", f"Error saving item to Firestore:\n{str(e)}")

    def load_inventory_to_form(self, iid, name, qty, thresh, exp):
        self.inventory_edit_id = iid
        self.ent_inv_name.delete(0, "end")
        self.ent_inv_name.insert(0, name)
        self.ent_inv_qty.delete(0, "end")
        self.ent_inv_qty.insert(0, str(qty))
        self.ent_inv_expiry.delete(0, "end")
        if exp:
            self.ent_inv_expiry.insert(0, exp)
            
        self.btn_save_inv.configure(text="Update Item Details", fg_color="#2ECC71")

    def delete_inventory_action(self, iid, name):
        if messagebox.askyesno("Confirm Deletion", f"Remove item '{name}' from the supplies inventory completely?"):
            try:
                self.firebase_helper.delete_document("inventory", iid)
                messagebox.showinfo("Success", "Supply item removed successfully.")
                self.clear_inventory_form()
                self.refresh_inventory_list()
            except Exception as e:
                messagebox.showerror("Error", f"Failed to delete inventory item from Cloud:\n{str(e)}")

    def refresh_inventory_list(self):
        for widget in self.inventory_scroll.winfo_children():
            widget.destroy()
            
        try:
            items = self.firebase_helper.get_all_documents("inventory")
            items.sort(key=lambda x: x.get("item_name", ""))
            
            if not items:
                ctk.CTkLabel(self.inventory_scroll, text="No supply items currently in stock.", text_color="gray").pack(pady=20)
                return
                
            for item in items:
                iid = item["id"]
                name = item.get("item_name", "")
                qty = item.get("quantity", 0)
                exp = item.get("expiry_date", "")
                
                bg_indicator = "#2a2a30"
                row_frame = ctk.CTkFrame(self.inventory_scroll, fg_color=bg_indicator, corner_radius=6)
                row_frame.pack(fill="x", pady=5, padx=5)
                
                main_text = f"📦 {name}\nStock: {qty}"
                if exp:
                    main_text += f" | Expiry: {exp}"
                
                lbl = ctk.CTkLabel(row_frame, text=main_text, justify="left", font=ctk.CTkFont(size=12))
                lbl.pack(side="left", padx=15, pady=8)
                
                # Action controls
                actions = ctk.CTkFrame(row_frame, fg_color="transparent")
                actions.pack(side="right", padx=10)
                
                btn_edit = ctk.CTkButton(
                    actions, text="✏️ Edit", width=60, height=26, fg_color="#34495E",
                    command=lambda id_val=iid, n=name, q=qty, e=exp: self.load_inventory_to_form(id_val, n, q, 0, e)
                )
                btn_edit.pack(side="left", padx=3)
                
                btn_del = ctk.CTkButton(
                    actions, text="🗑️ Delete", width=65, height=26, fg_color="#C0392B", hover_color="#922B21",
                    command=lambda id_val=iid, n=name: self.delete_inventory_action(id_val, n)
                )
                btn_del.pack(side="left", padx=3)
        except Exception as e:
            messagebox.showerror("Error", f"Failed to retrieve inventory list from Firestore:\n{str(e)}")

# ------------------------------------------------------------------
# 9. APPLICATION ENTRY POINT
# ------------------------------------------------------------------
if __name__ == "__main__":
    app = SchoolApp()
    app.mainloop()
