import { useState } from "react";
import "./SplitExpense.css";

const API_URL = "http://127.0.0.1:8000";

function SplitExpense({
  groupId,
  currentUser,
  onExpenseCreated,
}) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [participantIds, setParticipantIds] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Wait until logged-in user data is available
  if (!currentUser) {
    return (
      <section className="split-card">
        <p className="split-muted">
          Loading user information...
        </p>
      </section>
    );
  }

  const currentUserId = Number(currentUser.id);

  // Convert "3, 4" → [3, 4]
  const participants = participantIds
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id !== "")
    .map((id) => Number(id))
    .filter(
      (id, index, array) =>
        Number.isInteger(id) &&
        id > 0 &&
        array.indexOf(id) === index
    );

  const numericAmount = Number(amount);

  const showPreview =
    participants.length > 0 &&
    Number.isFinite(numericAmount) &&
    numericAmount > 0;

  const previewShare = showPreview
    ? numericAmount / participants.length
    : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!description.trim()) {
      setMessage("Please enter a description.");
      return;
    }

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      setMessage("Please enter a valid amount.");
      return;
    }

    if (participants.length === 0) {
      setMessage("Please enter participant User IDs.");
      return;
    }

    if (!participants.includes(currentUserId)) {
      setMessage(
        `Include your User ID (${currentUserId}) in the split.`
      );
      return;
    }

    const amountCents = Math.round(
      numericAmount * 100
    );

    // Equal split in cents
    const baseShare = Math.floor(
      amountCents / participants.length
    );

    let remainder =
      amountCents -
      baseShare * participants.length;

    const splits = participants.map((userId) => {
      let share = baseShare;

      if (remainder > 0) {
        share += 1;
        remainder -= 1;
      }

      return {
        user_id: userId,
        share_cents: share,
      };
    });

    const token = localStorage.getItem("token");

    if (!token) {
      setMessage("Please login again.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/groups/${groupId}/expenses`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            description: description.trim(),
            paid_by: currentUserId,
            amount_cents: amountCents,
            splits,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage(
          "Split expense added successfully!"
        );

        setDescription("");
        setAmount("");
        setParticipantIds("");

        if (onExpenseCreated) {
          await onExpenseCreated();
        }
      } else {
        setMessage(
          data.detail ||
            "Could not create split expense."
        );
      }
    } catch (error) {
      console.error("Split expense error:", error);

      setMessage(
        "Cannot connect to the backend."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="split-card">
      <div className="split-heading">
        <div>
          <span className="split-eyebrow">
            SPLIT EXPENSE
          </span>

          <h2>Add a shared expense</h2>

          <p>
            Divide an expense equally between
            registered group members.
          </p>
        </div>

        <div className="split-icon">
          ₹
        </div>
      </div>

      <form
        className="split-form"
        onSubmit={handleSubmit}
      >
        <div className="split-field">
          <label>Description</label>

          <input
            type="text"
            placeholder="e.g. Dinner"
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
            required
          />
        </div>

        <div className="split-field">
          <label>Total amount</label>

          <div className="split-money">
            <span>₹</span>

            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="800"
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value)
              }
              required
            />
          </div>
        </div>

        <div className="split-field split-full">
          <label>Participant User IDs</label>

          <input
            type="text"
            placeholder={`e.g. ${currentUserId}, 4`}
            value={participantIds}
            onChange={(e) =>
              setParticipantIds(e.target.value)
            }
            autoComplete="off"
            required
          />

          <small>
            Your User ID is {currentUserId}. Separate
            multiple IDs using commas.
          </small>
        </div>

        {showPreview && (
          <div className="split-preview split-full">
            <div className="split-preview-title">
              <span>Equal split preview</span>

              <strong>
                Total ₹{numericAmount.toFixed(2)}
              </strong>
            </div>

            <div className="split-preview-list">
              {participants.map((id) => (
                <div
                  className="split-person"
                  key={id}
                >
                  <div>
                    <span className="split-avatar">
                      {id === currentUserId
                        ? "YOU"
                        : id}
                    </span>

                    <span>
                      User #{id}
                      {id === currentUserId
                        ? " (You)"
                        : ""}
                    </span>
                  </div>

                  <strong>
                    ₹{previewShare.toFixed(2)}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          className="split-button split-full"
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Adding expense..."
            : "Split & Add Expense →"}
        </button>
      </form>

      {message && (
        <div className="split-message">
          {message}
        </div>
      )}
    </section>
  );
}

export default SplitExpense;