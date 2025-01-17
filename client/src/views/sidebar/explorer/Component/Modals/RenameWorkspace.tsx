import { ChangeEvent, useEffect, useRef, useState } from "react";

import Input from "../../../../../components/Input";
import Modal from "../../../../../components/Modal";
import { PgExplorer } from "../../../../../utils/pg";

export const RenameWorkspace = () => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus and select input on mount
  useEffect(() => {
    inputRef.current?.select();
  }, []);

  const workspaceName = PgExplorer.currentWorkspaceName ?? "";

  // Handle user input
  const [newName, setNewName] = useState(workspaceName);
  const [error, setError] = useState("");

  const handleChange = (ev: ChangeEvent<HTMLInputElement>) => {
    setNewName(ev.target.value);
    setError("");
  };

  const renameWorkspace = async () => {
    await PgExplorer.renameWorkspace(newName);
  };

  return (
    <Modal
      buttonProps={{
        text: "Rename",
        onSubmit: renameWorkspace,
        disabled: !newName || !!error,
        size: "small",
        setError,
      }}
      title={`Rename workspace '${workspaceName}'`}
    >
      <Input
        ref={inputRef}
        onChange={handleChange}
        value={newName}
        error={error}
        setError={setError}
        validator={PgExplorer.isWorkspaceNameValid}
      />
    </Modal>
  );
};
