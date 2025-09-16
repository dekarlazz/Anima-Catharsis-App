document.addEventListener('DOMContentLoaded', function() {
    // --- ELEMEN DOM ---
    const welcomeScreen = document.getElementById('welcome-screen');
    const mainApp = document.getElementById('main-app');
    const monthYearHeader = document.getElementById('month-year-header');
    const calendarGrid = document.getElementById('calendar-grid');
    const monthlyStats = document.getElementById('monthly-stats');
    const prevMonthBtn = document.getElementById('prev-month-btn');
    const nextMonthBtn = document.getElementById('next-month-btn');
    const diaryEntry = document.getElementById('diary-entry');
    const entryDateHeader = document.getElementById('entry-date-header');
    const moodSelector = document.getElementById('mood-selector');
    const notesArea = document.getElementById('notes-area');
    const saveBtn = document.getElementById('save-btn');
    const closeBtn = document.getElementById('close-btn');
    const exportBtn = document.getElementById('export-btn');
    const importBtn = document.getElementById('import-btn');
    const importFileInput = document.getElementById('import-file-input');
    const dailyTaskInput = document.getElementById('daily-task-input');
    const addDailyTaskBtn = document.getElementById('add-daily-task-btn');
    const dailyTaskList = document.getElementById('daily-task-list');
    const menstruationTracker = document.getElementById('menstruation-tracker');
    const loginEmailInput = document.getElementById('login-email');
    const loginPasswordInput = document.getElementById('login-password');
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const googleLoginBtn = document.getElementById('google-login-btn');
    const logoutBtn = document.getElementById('logout-btn');

    // --- STATE APLIKASI ---
    let currentDate = new Date();
    let selectedDateKey = null;
    let diaryData = {};
    const moodIcons = { happy: 'fa-smile-beam', calm: 'fa-smile', sad: 'fa-frown', angry: 'fa-angry', proud: 'fa-star' };
    const moodNames = { happy: 'Senang', calm: 'Biasa', sad: 'Sedih', angry: 'Marah', proud: 'Bangga' };

    // --- LOGIKA UTAMA & INISIALISASI ---
    function init() {
        setupEventListeners();

        auth.onAuthStateChanged(user => {
            if (user) {
                console.log("Pengguna login:", user.uid);
                showMainApp();
                loadDataFromFirestore(user.uid);
            } else {
                console.log("Tidak ada pengguna yang login.");
                showWelcomeScreen();
                diaryData = {};
                renderCalendar();
            }
        });
    }

    function showMainApp() {
        welcomeScreen.style.display = 'none';
        mainApp.classList.remove('hidden');
    }

    function showWelcomeScreen() {
        mainApp.classList.add('hidden');
        welcomeScreen.style.display = 'flex';
        if (diaryEntry.style.display === 'block') {
            closeDiaryEntry();
        }
    }

    async function loadDataFromFirestore(userId) {
        diaryData = {};
        const entriesRef = db.collection('users').doc(userId).collection('entries');
        try {
            const snapshot = await entriesRef.get();
            snapshot.forEach(doc => {
                diaryData[doc.id] = doc.data();
            });
            console.log("Data berhasil dimuat dari Firestore.");
            renderCalendar();
        } catch (error) {
            console.error("Gagal memuat data:", error);
            alert("Gagal memuat data dari cloud.");
        }
    }

    function renderCalendar() {
        calendarGrid.innerHTML = '';
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        monthYearHeader.textContent = `${currentDate.toLocaleString("id-ID",{month:"long"})} ${year}`;
        renderMonthlyStats();
        
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
        
        dayNames.forEach(day => {
            const dayNameCell = document.createElement("div");
            dayNameCell.classList.add("day-name");
            dayNameCell.textContent = day;
            calendarGrid.appendChild(dayNameCell);
        });
        
        for (let i = 0; i < firstDayOfMonth; i++) {
            calendarGrid.appendChild(document.createElement("div"));
        }
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dayCell = document.createElement("div");
            dayCell.classList.add("day-cell");
            dayCell.dataset.date = `${year}-${month}-${day}`;
            const dateNumber = document.createElement("span");
            dateNumber.classList.add("date-number");
            dateNumber.textContent = day;
            dayCell.appendChild(dateNumber);
            
            const today = new Date();
            if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
                dayCell.classList.add("today");
            }
            
            const dateKey = `${year}-${month}-${day}`;
            const iconContainer = document.createElement('div');
            iconContainer.className = 'icon-container';
            
            if (diaryData[dateKey]) {
                if (diaryData[dateKey].mood) {
                    const moodIcon = document.createElement("i");
                    moodIcon.classList.add("fas", moodIcons[diaryData[dateKey].mood], "mood-icon", diaryData[dateKey].mood);
                    iconContainer.appendChild(moodIcon);
                }
                if (diaryData[dateKey].isMenstruating) {
                    const menstruationIcon = document.createElement('i');
                    menstruationIcon.classList.add('fas', 'fa-tint', 'menstruation-icon');
                    iconContainer.appendChild(menstruationIcon);
                }
            }
            dayCell.appendChild(iconContainer);
            dayCell.addEventListener("click", () => openDiaryEntry(year, month, day));
            calendarGrid.appendChild(dayCell);
        }
    }

    function renderMonthlyStats() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const moodCounts = { happy: 0, calm: 0, sad: 0, angry: 0, proud: 0 };
        let totalEntries = 0;
        
        for (const dateKey in diaryData) {
            const [entryYear, entryMonth] = dateKey.split("-").map(Number);
            if (entryYear === year && entryMonth === month) {
                const entry = diaryData[dateKey];
                if (entry.mood) {
                    moodCounts[entry.mood]++;
                    totalEntries++;
                }
            }
        }
        
        if (totalEntries === 0) {
            monthlyStats.textContent = "Belum ada data mood untuk bulan ini.";
            return;
        }
        
        let statsTextParts = [];
        for (const mood in moodCounts) {
            if (moodCounts[mood] > 0) {
                statsTextParts.push(`**${moodNames[mood]}** sebanyak ${moodCounts[mood]} hari`);
            }
        }
        
        let finalStatsText = "Bulan ini kamu merasa ";
        if (statsTextParts.length > 1) {
            finalStatsText += statsTextParts.slice(0, -1).join(", ") + " dan " + statsTextParts.slice(-1);
        } else {
            finalStatsText += statsTextParts[0];
        }
        monthlyStats.innerHTML = finalStatsText.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    }

    function openDiaryEntry(year, month, day) {
        diaryEntry.style.display = 'block';
        selectedDateKey = `${year}-${month}-${day}`;
        const date = new Date(year, month, day);
        entryDateHeader.textContent = date.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        notesArea.value = '';
        dailyTaskList.innerHTML = '';
        document.querySelectorAll('.mood-option').forEach(opt => opt.classList.remove('selected'));
        menstruationTracker.classList.remove('selected');

        const entryData = diaryData[selectedDateKey];
        if (entryData) {
            notesArea.value = entryData.notes || '';
            if (entryData.mood) {
                document.querySelector(`.mood-option[data-mood="${entryData.mood}"]`).classList.add('selected');
            }
            if (entryData.dailyTasks) {
                entryData.dailyTasks.forEach(task => renderSingleTask(task.text, task.completed));
            }
            if (entryData.isMenstruating) {
                menstruationTracker.classList.add('selected');
            }
        }
    }
    
    function renderSingleTask(text, isCompleted) {
        const li = document.createElement('li');
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = isCompleted;
        const span = document.createElement('span');
        span.textContent = text;
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '&times;';
        deleteBtn.className = 'delete-daily-task-btn';
        deleteBtn.title = 'Hapus tugas';
        label.appendChild(checkbox);
        label.appendChild(span);
        li.appendChild(label);
        li.appendChild(deleteBtn);
        dailyTaskList.appendChild(li);
    }
    
    function handleAddDailyTask() {
        const taskText = dailyTaskInput.value.trim();
        if (taskText) {
            renderSingleTask(taskText, false);
            dailyTaskInput.value = '';
            dailyTaskInput.focus();
        }
    }

    async function handleSave() {
        if (!selectedDateKey) return;
        const currentUser = auth.currentUser;
        if (!currentUser) {
            alert("Sesi Anda telah berakhir. Silakan login kembali untuk menyimpan.");
            return;
        }
        const selectedMoodEl = document.querySelector('.mood-option.selected');
        const mood = selectedMoodEl ? selectedMoodEl.dataset.mood : null;
        const notes = notesArea.value;
        const isMenstruating = menstruationTracker.classList.contains('selected');
        const currentDailyTasks = [];
        dailyTaskList.querySelectorAll('li').forEach(li => {
            const checkbox = li.querySelector('input[type="checkbox"]');
            const label = li.querySelector('span');
            currentDailyTasks.push({ text: label.textContent, completed: checkbox.checked });
        });
        const entryDataToSave = {
            mood: mood,
            dailyTasks: currentDailyTasks,
            notes: notes,
            isMenstruating: isMenstruating,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        };
        const entryRef = db.collection('users').doc(currentUser.uid).collection('entries').doc(selectedDateKey);
        try {
            await entryRef.set(entryDataToSave, { merge: true });
            alert('Catatan berhasil disimpan ke cloud!');
            diaryData[selectedDateKey] = entryDataToSave;
            closeDiaryEntry();
            renderCalendar();
        } catch (error) {
            console.error("Gagal menyimpan ke Firestore:", error);
            alert("Gagal menyimpan data. Periksa koneksi internetmu.");
        }
    }

    function closeDiaryEntry() {
        diaryEntry.style.display = "none";
        selectedDateKey = null;
    }

    function handleExport() {
        if (Object.keys(diaryData).length === 0) {
            alert("Tidak ada data untuk diekspor.");
            return;
        }
        const dataToExport = { diaryData: diaryData };
        const dataStr = JSON.stringify(dataToExport, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement("a");
        link.href = url;
        const today = new Date().toISOString().slice(0, 10);
        link.download = `anima-catharsis-backup-${today}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    function handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;
        if (!confirm("Apakah kamu yakin ingin mengimpor data? SEMUA DATA SAAT INI AKAN DIGANTI dengan data dari file. Fitur ini tidak akan tersinkronisasi ke cloud.")) {
            event.target.value = null;
            return;
        }
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                if (importedData.diaryData) {
                    diaryData = importedData.diaryData;
                    renderCalendar();
                    alert("Data berhasil diimpor secara lokal! Ingat, data ini belum tersimpan di cloud sampai Anda menyimpan setiap entri secara manual.");
                } else {
                    alert("File tidak valid. Pastikan file backup Anda benar.");
                }
            } catch (error) {
                alert("Gagal membaca file. File mungkin rusak atau formatnya salah.");
                console.error("Import error:", error);
            }
        };
        reader.readAsText(file);
        event.target.value = null;
    }

    function setupEventListeners() {
        if (prevMonthBtn) prevMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
        });
        if (nextMonthBtn) nextMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
        });
        if (saveBtn) saveBtn.addEventListener('click', handleSave);
        if (closeBtn) closeBtn.addEventListener('click', closeDiaryEntry);
        if (exportBtn) exportBtn.addEventListener('click', handleExport);
        if (importBtn && importFileInput) {
            importBtn.addEventListener('click', () => importFileInput.click());
            importFileInput.addEventListener('change', handleFileSelect);
        }
        if (addDailyTaskBtn) addDailyTaskBtn.addEventListener('click', handleAddDailyTask);
        if (dailyTaskInput) {
            dailyTaskInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddDailyTask();
                }
            });
        }
        if (dailyTaskList) {
            dailyTaskList.addEventListener('click', (e) => {
                if (e.target.classList.contains('delete-daily-task-btn')) {
                    e.target.parentElement.remove();
                }
            });
        }
        if (moodSelector) {
            moodSelector.addEventListener('click', (e) => {
                const selectedOption = e.target.closest('.mood-option');
                if (!selectedOption) return;
                document.querySelectorAll('.mood-option').forEach(opt => opt.classList.remove('selected'));
                selectedOption.classList.add('selected');
            });
        }
        if (menstruationTracker) {
            menstruationTracker.addEventListener('click', () => {
                menstruationTracker.classList.toggle('selected');
            });
        }
        if (loginBtn && loginEmailInput && loginPasswordInput) {
            loginBtn.addEventListener('click', () => {
                const email = loginEmailInput.value;
                const password = loginPasswordInput.value;
                if (email && password) {
                    auth.signInWithEmailAndPassword(email, password)
                        .catch(error => alert("Gagal login: " + error.message));
                } else {
                    alert("Mohon isi email dan password.");
                }
            });
        }
        if (registerBtn && loginEmailInput && loginPasswordInput) {
            registerBtn.addEventListener('click', () => {
                const email = loginEmailInput.value;
                const password = loginPasswordInput.value;
                if (email && password) {
                    auth.createUserWithEmailAndPassword(email, password)
                        .then(() => {
                            alert("Akun berhasil dibuat! Silakan login dengan akun yang baru.");
                            loginEmailInput.value = '';
                            loginPasswordInput.value = '';
                        })
                        .catch(error => alert("Gagal membuat akun: " + error.message));
                } else {
                    alert("Mohon isi email dan password.");
                }
            });
        }
        if (googleLoginBtn) {
            googleLoginBtn.addEventListener('click', () => {
                auth.signInWithPopup(googleProvider)
                    .catch(error => alert("Gagal login dengan Google: " + error.message));
            });
        }
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                auth.signOut();
            });
        }
    }
    
    init();
});