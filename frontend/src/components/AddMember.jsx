import { useState } from "react";
import { addGroupMember } from "../api/api";
import StatusMessage from "./StatusMessage";

function AddMember({
  groupId,
  onMemberAdded,
}) {
  const [memberName, setMemberName] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [messageType, setMessageType] =
    useState("info");

  const [loading, setLoading] =
    useState(false);

  const handleAddMember = async (e) => {
    e.preventDefault();

    const cleanName = memberName.trim();

    if (!cleanName) {
      setMessage(
        "Please enter the member's name."
      );
      setMessageType("error");
      return;
    }

    if (cleanName.length > 100) {
      setMessage(
        "Member name is too long."
      );
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const { response, data } =
        await addGroupMember(
          groupId,
          cleanName
        );

      if (response.ok) {
        setMessage(
          `${data.name} added as Member ${data.member_number}!`
        );

        setMessageType("success");
        setMemberName("");
window.dispatchEvent(
  new Event("splitease-member-added")
);
        if (onMemberAdded) {
          await onMemberAdded();
        }
      } else {
        setMessage(
          data.detail ||
            "Could not add member."
        );

        setMessageType("error");
      }
    } catch (error) {
      console.error(
        "Add member error:",
        error
      );

      setMessage(
        "Cannot connect to the backend."
      );

      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="modern-section">
      <div className="section-heading">
        <div>
          <span className="section-eyebrow">
            GROUP MEMBERS
          </span>

          <h2>Add a member</h2>
        </div>
      </div>

      <p className="muted-text">
        Add anyone to this group by name.
        They do not need a SplitEase account.
      </p>

      <form
        className="member-form"
        onSubmit={handleAddMember}
      >
        <div className="member-input-group">
          <label htmlFor="member-name">
            Member name
          </label>

          <input
            id="member-name"
            name="memberName"
            type="text"
            placeholder="e.g. Ishita Arun"
            value={memberName}
            onChange={(e) => {
              setMemberName(
                e.target.value
              );

              if (message) {
                setMessage("");
              }
            }}
            autoComplete="off"
            disabled={loading}
            required
          />
        </div>

        <button
          className="member-add-btn"
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Adding member..."
            : "Add Member +"}
        </button>
      </form>

      <StatusMessage
        message={message}
        type={messageType}
      />
    </section>
  );
}

export default AddMember;