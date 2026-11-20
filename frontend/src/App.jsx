import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(
    Boolean(localStorage.getItem("token"))
  );

  const [user, setUser] = useState(null);

  // Authentication
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  // Groups
  const [groups, setGroups] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [groupMessage, setGroupMessage] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(null);

  // Expenses
  const [expenses, setExpenses] = useState([]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseMessage, setExpenseMessage] = useState("");

  // Balances
  const [balances, setBalances] = useState([]);

  // =====================================================
  // CURRENT USER
  // =====================================================

  useEffect(() => {
    if (!isLoggedIn) return;

    const getUser = async () => {
      const token = localStorage.getItem("token");

      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (response.ok) {
          setUser(data);
        } else {
          handleLogout();
        }
      } catch (error) {
        console.error("User loading error:", error);
      }
    };

    getUser();
  }, [isLoggedIn]);

  // =====================================================
  // GROUPS
  // =====================================================

  useEffect(() => {
    if (isLoggedIn) {
      loadGroups();
    }
  }, [isLoggedIn]);

  const loadGroups = async () => {
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_URL}/groups`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setGroups(data);
      }
    } catch (error) {
      console.error("Group loading error:", error);
    }
  };

  // =====================================================
  // LOGIN / REGISTER
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (isLogin) {
      try {
        const formData = new URLSearchParams();

        formData.append("username", email);
        formData.append("password", password);

        const response = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData,
        });

        const data = await response.json();

        if (response.ok) {
          localStorage.setItem("token", data.access_token);

          setIsLoggedIn(true);
          setEmail("");
          setPassword("");
          setMessage("");
        } else {
          setMessage(data.detail || "Invalid email or password.");
        }
      } catch (error) {
        console.error(error);
        setMessage("Cannot connect to the backend.");
      }

      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          email,
          name,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Account created successfully!");

        setName("");
        setEmail("");
        setPassword("");

        setTimeout(() => {
          setIsLogin(true);
          setMessage("");
        }, 1500);
      } else {
        setMessage(data.detail || "Registration failed.");
      }
    } catch (error) {
      console.error(error);
      setMessage("Cannot connect to the backend.");
    }
  };

  // =====================================================
  // CREATE GROUP
  // =====================================================

  const createGroup = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_URL}/groups`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          name: groupName,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setGroupName("");
        setGroupMessage("Group created successfully!");

        await loadGroups();
      } else {
        setGroupMessage(data.detail || "Could not create group.");
      }
    } catch (error) {
      console.error(error);
      setGroupMessage("Cannot connect to backend.");
    }
  };

  // =====================================================
  // OPEN GROUP
  // =====================================================

  const openGroup = async (group) => {
    setSelectedGroup(group);
    setExpenseMessage("");

    await loadExpenses(group.id);
    await loadBalances(group.id);
  };

  // =====================================================
  // EXPENSES
  // =====================================================

  const loadExpenses = async (groupId) => {
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        `${API_URL}/groups/${groupId}/expenses`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setExpenses(data);
      }
    } catch (error) {
      console.error("Expense loading error:", error);
    }
  };

  const loadBalances = async (groupId) => {
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        `${API_URL}/groups/${groupId}/balances`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setBalances(data);
      }
    } catch (error) {
      console.error("Balance loading error:", error);
    }
  };

  const createExpense = async (e) => {
    e.preventDefault();

    if (!user || !selectedGroup) return;

    const rupees = Number(amount);

    if (!description.trim() || !Number.isFinite(rupees) || rupees <= 0) {
      setExpenseMessage("Enter a valid description and amount.");
      return;
    }

    const amountCents = Math.round(rupees * 100);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        `${API_URL}/groups/${selectedGroup.id}/expenses`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            description,
            paid_by: user.id,
            amount_cents: amountCents,

            splits: [
              {
                user_id: user.id,
                share_cents: amountCents,
              },
            ],
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setDescription("");
        setAmount("");
        setExpenseMessage("Expense added successfully!");

        await loadExpenses(selectedGroup.id);
        await loadBalances(selectedGroup.id);
      } else {
        setExpenseMessage(data.detail || "Could not add expense.");
      }
    } catch (error) {
      console.error(error);
      setExpenseMessage("Cannot connect to backend.");
    }
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem("token");

    setIsLoggedIn(false);
    setUser(null);
    setGroups([]);
    setSelectedGroup(null);
    setExpenses([]);
    setBalances([]);

    setEmail("");
    setPassword("");
    setMessage("");
  };

  // =====================================================
  // GROUP DETAILS
  // =====================================================

  if (isLoggedIn && selectedGroup) {
    return (
      <div className="page">
        <div className="dashboard-card">
          <div className="dashboard-header">
            <div>
              <button
                className="back-btn"
                onClick={() => {
                  setSelectedGroup(null);
                  setExpenses([]);
                  setBalances([]);
                  setExpenseMessage("");
                }}
              >
                ← Back
              </button>

              <h1>{selectedGroup.name}</h1>

              <p className="subtitle dashboard-subtitle">
                Group #{selectedGroup.id}
              </p>
            </div>

            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>

          <div className="dashboard-section">
            <h2>Add Expense</h2>

            <p className="section-description">
              Add a new expense to this group.
            </p>

            <form className="expense-form" onSubmit={createExpense}>
              <input
                type="text"
                placeholder="Expense description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />

              <input
                type="number"
                placeholder="Amount in ₹"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />

              <button type="submit">Add Expense</button>
            </form>

            {expenseMessage && (
              <p className="group-message">{expenseMessage}</p>
            )}
          </div>

          <div className="dashboard-section">
            <h2>Expenses</h2>

            {expenses.length === 0 ? (
              <div className="empty-groups">
                <h3>No expenses yet</h3>
                <p>Add your first expense above.</p>
              </div>
            ) : (
              <div className="expense-list">
                {expenses.map((expense) => (
                  <div className="expense-card" key={expense.id}>
                    <div>
                      <h3>{expense.description}</h3>
                      <p>Paid by User #{expense.paid_by}</p>
                    </div>

                    <strong className="expense-amount">
                      ₹{(expense.amount_cents / 100).toFixed(2)}
                    </strong>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="dashboard-section">
            <h2>Balances</h2>

            {balances.length === 0 ? (
              <p className="section-description">
                No balance information available.
              </p>
            ) : (
              <div className="balance-list">
                {balances.map((balance) => (
                  <div className="balance-card" key={balance.user_id}>
                    <span>User #{balance.user_id}</span>

                    <strong>
                      ₹{(balance.net_cents / 100).toFixed(2)}
                    </strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // DASHBOARD
  // =====================================================

  if (isLoggedIn) {
    return (
      <div className="page">
        <div className="dashboard-card">
          <div className="dashboard-header">
            <div>
              <h1>Expense Splitter</h1>

              <p className="subtitle dashboard-subtitle">
                {user ? `Welcome, ${user.name}!` : "Loading your account..."}
              </p>
            </div>

            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>

          <div className="dashboard-section">
            <h2>Create a Group</h2>

            <p className="section-description">
              Create a group for friends, roommates or trips.
            </p>

            <form className="group-form" onSubmit={createGroup}>
              <input
                type="text"
                placeholder="Example: Goa Trip"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                required
              />

              <button type="submit">Create Group</button>
            </form>

            {groupMessage && (
              <p className="group-message">{groupMessage}</p>
            )}
          </div>

          <div className="dashboard-section">
            <h2>My Groups</h2>

            {groups.length === 0 ? (
              <div className="empty-groups">
                <div className="empty-icon">₹</div>

                <h3>No groups yet</h3>

                <p>
                  Create your first group to start splitting expenses.
                </p>
              </div>
            ) : (
              <div className="groups-grid">
                {groups.map((group) => (
                  <button
                    type="button"
                    className="group-card clickable-group"
                    key={group.id}
                    onClick={() => openGroup(group)}
                  >
                    <div className="group-icon">₹</div>

                    <div>
                      <h3>{group.name}</h3>
                      <p>Group #{group.id}</p>
                      <span className="open-text">Open group →</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // CREATIVE LOGIN / REGISTER PAGE
  // =====================================================

  return (
    <div className="auth-page">
      <div className="auth-shell">

        <section className="auth-hero">
          <div className="brand">
            <div className="brand-icon">₹</div>
            <span>Splitly</span>
          </div>

          <div className="hero-content">
            <span className="hero-badge">SMART EXPENSE SHARING</span>

            <h1>
              Split smarter.
              <br />
              <span>Live lighter.</span>
            </h1>

            <p>
              Keep trips, dinners and shared bills simple.
              Track expenses, organize groups and know exactly
              where your money went.
            </p>

            <div className="feature-list">
              <div className="feature-item">
                <span className="feature-check">✓</span>
                <div>
                  <strong>Simple group expenses</strong>
                  <small>Create groups for trips, friends and roommates.</small>
                </div>
              </div>

              <div className="feature-item">
                <span className="feature-check">✓</span>
                <div>
                  <strong>Clear expense history</strong>
                  <small>Keep every shared payment organized.</small>
                </div>
              </div>

              <div className="feature-item">
                <span className="feature-check">✓</span>
                <div>
                  <strong>Balance tracking</strong>
                  <small>See your group balances without messy calculations.</small>
                </div>
              </div>
            </div>
          </div>

          <p className="hero-footer">
            Built for easier shared spending.
          </p>
        </section>

        <section className="auth-panel">
          <div className="mobile-brand">
            <div className="brand-icon">₹</div>
            <span>Splitly</span>
          </div>

          <div className="auth-panel-content">
            <span className="auth-eyebrow">
              {isLogin ? "WELCOME BACK" : "GET STARTED"}
            </span>

            <h2>
              {isLogin ? "Sign in to your account" : "Create your account"}
            </h2>

            <p className="auth-description">
              {isLogin
                ? "Continue managing your shared expenses."
                : "Start splitting expenses without the awkward maths."}
            </p>

            <div className="auth-tabs">
              <button
                type="button"
                className={isLogin ? "active" : ""}
                onClick={() => {
                  setIsLogin(true);
                  setMessage("");
                }}
              >
                Sign In
              </button>

              <button
                type="button"
                className={!isLogin ? "active" : ""}
                onClick={() => {
                  setIsLogin(false);
                  setMessage("");
                }}
              >
                Register
              </button>
            </div>

            <form className="modern-auth-form" onSubmit={handleSubmit}>
              {!isLogin && (
                <div className="modern-form-group">
                  <label>Full name</label>

                  <div className="input-wrapper">
                    <span className="input-icon">👤</span>

                    <input
                      type="text"
                      placeholder="Enter your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="modern-form-group">
                <label>Email address</label>

                <div className="input-wrapper">
                  <span className="input-icon">✉</span>

                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modern-form-group">
                <label>Password</label>

                <div className="input-wrapper">
                  <span className="input-icon">⌑</span>

                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button className="modern-submit-btn" type="submit">
                {isLogin ? "Sign In" : "Create Account"}
                <span>→</span>
              </button>
            </form>

            {message && (
              <div className="auth-message">
                {message}
              </div>
            )}

            <p className="auth-switch-text">
              {isLogin ? "New to Splitly?" : "Already have an account?"}

              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setMessage("");
                }}
              >
                {isLogin ? "Create an account" : "Sign in"}
              </button>
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}

export default App;