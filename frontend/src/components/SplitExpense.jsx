import { useEffect, useState } from "react";
import {
  createExpense,
  getGroupMembers,
} from "../api/api";
import StatusMessage from "./StatusMessage";
import "./SplitExpense.css";

function SplitExpense({
  groupId,
  currentUser,
  onExpenseCreated,
}) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  // User types visible group member numbers:
  // e.g. 1,2,3
  const [participantNumbers, setParticipantNumbers] =
    useState("");

  const [groupMembers, setGroupMembers] = useState([]);
  const [membersLoading, setMembersLoading] =
    useState(true);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
    useState("info");

  const [loading, setLoading] = useState(false);

  // Used to reload members after Add Member
  const [refreshKey, setRefreshKey] = useState(0);

  // =====================================================
  // LOAD GROUP MEMBERS
  // =====================================================

  const loadMembers = async () => {
    if (!groupId) return;

    setMembersLoading(true);

    try {
      const { response, data } =
        await getGroupMembers(groupId);

      if (response.ok && Array.isArray(data)) {
        setGroupMembers(data);
      } else {
        setGroupMembers([]);

        setMessage(
          data?.detail ||
            "Could not load group members."
        );

        setMessageType("error");
      }
    } catch (error) {
      console.error(
        "Group members loading error:",
        error
      );

      setGroupMembers([]);

      setMessage(
        "Cannot load group members."
      );

      setMessageType("error");
    } finally {
      setMembersLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [groupId, refreshKey]);

  // Allow another component/event to refresh
  // this list if needed.
  useEffect(() => {
    const handleMemberAdded = () => {
      setRefreshKey((value) => value + 1);
    };

    window.addEventListener(
      "splitease-member-added",
      handleMemberAdded
    );

    return () => {
      window.removeEventListener(
        "splitease-member-added",
        handleMemberAdded
      );
    };
  }, []);

  // =====================================================
  // CURRENT USER
  // =====================================================

  if (!currentUser) {
    return (
      <section className="split-card">
        <StatusMessage
          message="Loading user information..."
          type="info"
        />
      </section>
    );
  }

  // Owner is the member whose is_owner is true.
  const ownerMember = groupMembers.find(
    (member) => member.is_owner
  );

  // =====================================================
  // PARSE VISIBLE MEMBER NUMBERS
  // =====================================================

  const selectedNumbers = participantNumbers
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value !== "")
    .map((value) => Number(value))
    .filter(
      (value, index, array) =>
        Number.isInteger(value) &&
        value > 0 &&
        array.indexOf(value) === index
    );

  // Convert:
  // 1,2,3
  //
  // into the actual GroupMember objects.
  const selectedMembers = selectedNumbers
    .map((memberNumber) =>
      groupMembers.find(
        (member) =>
          Number(member.member_number) ===
          memberNumber
      )
    )
    .filter(Boolean);

  // Numbers entered that don't exist.
  const invalidNumbers = selectedNumbers.filter(
    (memberNumber) =>
      !groupMembers.some(
        (member) =>
          Number(member.member_number) ===
          memberNumber
      )
  );

  const numericAmount = Number(amount);

  const showPreview =
    selectedMembers.length > 0 &&
    invalidNumbers.length === 0 &&
    Number.isFinite(numericAmount) &&
    numericAmount > 0;

  const previewShare = showPreview
    ? numericAmount / selectedMembers.length
    : 0;

  // =====================================================
  // ERROR
  // =====================================================

  const showError = (text) => {
    setMessage(text);
    setMessageType("error");
  };

  // =====================================================
  // SUBMIT EXPENSE
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setMessage("");

    if (!description.trim()) {
      showError(
        "Please enter a description."
      );
      return;
    }

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      showError(
        "Please enter a valid amount."
      );
      return;
    }

    if (selectedNumbers.length === 0) {
      showError(
        "Please enter the member numbers to split between."
      );
      return;
    }

    if (invalidNumbers.length > 0) {
      showError(
        `Member number ${invalidNumbers.join(
          ", "
        )} does not exist in this group.`
      );
      return;
    }

    if (!ownerMember) {
      showError(
        "Could not identify the group owner."
      );
      return;
    }

    // Keep the same behavior as before:
    // the logged-in owner is paying the expense.
    //
    // They must also be part of the split.
    const ownerIncluded = selectedMembers.some(
      (member) =>
        Number(member.id) ===
        Number(ownerMember.id)
    );

    if (!ownerIncluded) {
      showError(
        `Include your member number (${ownerMember.member_number}) in the split.`
      );
      return;
    }

    // ===================================================
    // CALCULATE SHARES IN PAISE
    // ===================================================

    const amountCents = Math.round(
      numericAmount * 100
    );

    const baseShare = Math.floor(
      amountCents / selectedMembers.length
    );

    let remainder =
      amountCents -
      baseShare * selectedMembers.length;

    const splits = selectedMembers.map(
      (member) => {
        let share = baseShare;

        if (remainder > 0) {
          share += 1;
          remainder -= 1;
        }

        return {
          // IMPORTANT:
          // Actual GroupMember database ID.
          member_id: Number(member.id),

          share_cents: share,
        };
      }
    );

    const expenseData = {
      description: description.trim(),

      // Logged-in owner is the payer.
      paid_by_member_id: Number(
        ownerMember.id
      ),

      amount_cents: amountCents,

      splits,
    };

    // ===================================================
    // SEND TO BACKEND
    // ===================================================

    setLoading(true);

    try {
      const { response, data } =
        await createExpense(
          groupId,
          expenseData
        );

      if (response.ok) {
        setMessage(
          "Split expense added successfully!"
        );

        setMessageType("success");

        setDescription("");
        setAmount("");
        setParticipantNumbers("");

        if (onExpenseCreated) {
          await onExpenseCreated();
        }
      } else {
        showError(
          data.detail ||
            "Could not create split expense."
        );
      }
    } catch (error) {
      console.error(
        "Split expense error:",
        error
      );

      showError(
        "Cannot connect to the backend."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // UI
  // =====================================================

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
            the members saved in this group.
          </p>
        </div>

        <div className="split-icon">
          ₹
        </div>
      </div>

      {/* ===============================================
          SAVED GROUP MEMBERS
      =============================================== */}

      <div className="split-members">
        <div className="split-members-header">
          <div>
            <span className="split-eyebrow">
              GROUP MEMBERS
            </span>

            <h3>Member numbers</h3>
          </div>

          {!membersLoading && (
            <span className="split-member-count">
              {groupMembers.length} member
              {groupMembers.length !== 1
                ? "s"
                : ""}
            </span>
          )}
        </div>

        {membersLoading ? (
          <p className="split-members-loading">
            Loading group members...
          </p>
        ) : groupMembers.length === 0 ? (
          <p className="split-members-loading">
            No members found.
          </p>
        ) : (
          <div className="split-member-list">
            {groupMembers.map((member) => (
              <div
                className="split-member-row"
                key={member.id}
              >
                <span className="split-member-number">
                  {member.member_number}
                </span>

                <div className="split-member-details">
                  <strong>
                    {member.name}
                    {member.is_owner
                      ? " (You)"
                      : ""}
                  </strong>

                  <small>
                    Member #{member.member_number}
                  </small>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===============================================
          EXPENSE FORM
      =============================================== */}

      <form
        className="split-form"
        onSubmit={handleSubmit}
      >
        <div className="split-field">
          <label>Description</label>

          <input
            type="text"
            placeholder="e.g. Travel"
            value={description}
            onChange={(e) => {
              setDescription(
                e.target.value
              );

              setMessage("");
            }}
            disabled={loading}
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
              placeholder="3000"
              value={amount}
              onChange={(e) => {
                setAmount(
                  e.target.value
                );

                setMessage("");
              }}
              disabled={loading}
              required
            />
          </div>
        </div>

        <div className="split-field split-full">
          <label>
            Split Between Member Numbers
          </label>

          <input
            type="text"
            placeholder={
              groupMembers.length >= 3
                ? "e.g. 1, 2, 3"
                : "e.g. 1, 2"
            }
            value={participantNumbers}
            onChange={(e) => {
              setParticipantNumbers(
                e.target.value
              );

              setMessage("");
            }}
            autoComplete="off"
            disabled={
              loading ||
              membersLoading
            }
            required
          />

          <small>
            Enter the member numbers shown
            above, separated by commas.
            {ownerMember
              ? ` Your number is ${ownerMember.member_number}.`
              : ""}
          </small>
        </div>

        {/* =============================================
            INVALID MEMBER WARNING
        ============================================= */}

        {invalidNumbers.length > 0 && (
          <div className="split-full">
            <StatusMessage
              message={`Member number ${invalidNumbers.join(
                ", "
              )} is not in this group.`}
              type="error"
            />
          </div>
        )}

        {/* =============================================
            PREVIEW
        ============================================= */}

        {showPreview && (
          <div className="split-preview split-full">
            <div className="split-preview-title">
              <span>
                Equal split preview
              </span>

              <strong>
                Total ₹
                {numericAmount.toFixed(2)}
              </strong>
            </div>

            <div className="split-preview-list">
              {selectedMembers.map(
                (member) => (
                  <div
                    className="split-person"
                    key={member.id}
                  >
                    <div>
                      <span className="split-avatar">
                        {member.is_owner
                          ? "YOU"
                          : member.member_number}
                      </span>

                      <span>
                        {member.name}
                        {member.is_owner
                          ? " (You)"
                          : ""}
                      </span>
                    </div>

                    <strong>
                      ₹
                      {previewShare.toFixed(
                        2
                      )}
                    </strong>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        <button
          className="split-button split-full"
          type="submit"
          disabled={
            loading ||
            membersLoading ||
            groupMembers.length === 0
          }
        >
          {loading
            ? "Adding expense..."
            : "Split & Add Expense →"}
        </button>
      </form>

      <StatusMessage
        message={message}
        type={messageType}
      />
    </section>
  );
}

export default SplitExpense;