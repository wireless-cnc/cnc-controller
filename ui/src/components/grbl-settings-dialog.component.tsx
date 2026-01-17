import { Fragment, useContext, useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Table from "react-bootstrap/Table";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import Badge from "react-bootstrap/Badge";
import Spinner from "react-bootstrap/Spinner";
import { useDispatch, useSelector } from "react-redux";
import { ControllerContext } from "@app/context";
import {
  GrblSettingsActions,
  GrblSettingsSelectors,
} from "@app/store/grblSettingsSlice";
import type { GrblSettingsRow } from "@app/store/grblSettingsSlice";
import { serializeSettingsJson, parseSettingsJson } from "@app/grbl/settingsImportExport";
import { BsDownload, BsUpload } from "react-icons/bs";

const GroupRow = styled.tr`
  background: var(--theme-bg-tertiary);
  font-weight: 600;
`;

const Description = styled.div`
  color: var(--theme-text-secondary);
  font-size: 0.85rem;
`;

const UnitText = styled.span`
  color: var(--theme-text-secondary);
  font-size: 0.85rem;
`;

const ValueWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const MaskGroup = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

interface Props {
  show: boolean;
  onClose: () => void;
}

export const GrblSettingsDialog = ({ show, onClose }: Props) => {
  const dispatch = useDispatch();
  const controller = useContext(ControllerContext);
  const rows = useSelector(GrblSettingsSelectors.selectRows);
  const fetchStatus = useSelector(GrblSettingsSelectors.selectFetchStatus);
  const saveStatus = useSelector(GrblSettingsSelectors.selectSaveStatus);
  const error = useSelector(GrblSettingsSelectors.selectError);
  const hasDirty = useSelector(GrblSettingsSelectors.selectHasDirty);
  const hasInvalidDirty = useSelector(GrblSettingsSelectors.selectHasInvalidDirty);
  const [search, setSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    dispatch(GrblSettingsActions.clearSaveStatus());
    onClose();
  };

  useEffect(() => {
    if (show) {
      dispatch(GrblSettingsActions.startFetch());
      controller?.sendGCode("$$");
    }
  }, [show, controller, dispatch]);

  const groupedRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const filtered = rows.filter((row) => {
      if (!normalizedSearch) {
        return true;
      }
      const text = `${row.meta.id} ${row.meta.name} ${row.meta.description}`.toLowerCase();
      return text.includes(normalizedSearch);
    });

    const groups: Record<string, typeof filtered> = {};
    filtered.forEach((row) => {
      const group = row.meta.group;
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(row);
    });

    return groups;
  }, [rows, search]);

  const requestRefresh = () => {
    if (!controller) {
      return;
    }
    dispatch(GrblSettingsActions.startFetch());
    controller.sendGCode("$$");
  };

  const handleSave = () => {
    if (!controller) {
      return;
    }
    const changes = rows.filter((row) => row.isDirty && row.valid);
    if (changes.length === 0) {
      return;
    }
    dispatch(GrblSettingsActions.beginSave({ pending: changes.length }));
    dispatch(GrblSettingsActions.applyDraftToCurrent(changes.map((c) => c.meta.id)));
    changes.forEach((row) => {
      controller.sendGCode(`${row.meta.id}=${row.draft.trim()}`);
    });
  };

  const handleResetDraft = () => {
    dispatch(GrblSettingsActions.resetDraftToCurrent());
  };

  const handleExport = () => {
    const settings: Record<string, number> = {};
    rows.forEach((row) => {
      if (row.valid && row.parsed !== undefined) {
        settings[row.meta.id] = row.parsed;
      } else if (row.current !== undefined) {
        settings[row.meta.id] = row.current;
      }
    });
    const json = serializeSettingsJson(settings);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "grbl-settings.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const text = await file.text();
    try {
      const parsed = parseSettingsJson(text);
      const draftValues: Record<string, string> = {};
      Object.entries(parsed.settings).forEach(([key, value]) => {
        draftValues[key] = String(value);
      });
      dispatch(GrblSettingsActions.setDraftValues(draftValues));
    } catch (err) {
      dispatch(
        GrblSettingsActions.setFetchError(
          err instanceof Error ? err.message : "Failed to import settings"
        )
      );
    } finally {
      event.target.value = "";
    }
  };

  const toggleMaskBit = (
    id: string,
    currentValue: number,
    bit: number,
    checked: boolean
  ) => {
    const nextValue = checked ? currentValue | bit : currentValue & ~bit;
    dispatch(GrblSettingsActions.setDraftValue({ id, value: String(nextValue) }));
  };

  const renderValueCell = (row: GrblSettingsRow) => {
    const { meta, draft, valid, parsed, current } = row;
    const hasInput = draft !== undefined;
    if (meta.type === "boolean") {
      const value = valid ? parsed ?? 0 : current ?? 0;
      const checked = value > 0;
      return (
        <Form.Check
          type="switch"
          checked={checked}
          onChange={(event) => {
            dispatch(
              GrblSettingsActions.setDraftValue({
                id: meta.id,
                value: event.target.checked ? "1" : "0",
              })
            );
          }}
        />
      );
    }

    if (meta.type === "mask" && meta.maskAxes?.length) {
      const value = Math.trunc(valid ? parsed ?? 0 : current ?? 0);
      return (
        <MaskGroup>
          {meta.maskAxes.map((axis, index) => {
            const bit = 1 << index;
            return (
              <Form.Check
                key={axis}
                label={axis}
                checked={(value & bit) !== 0}
                onChange={(event) =>
                  toggleMaskBit(meta.id, value, bit, event.target.checked)
                }
              />
            );
          })}
        </MaskGroup>
      );
    }

    return (
      <ValueWrapper>
        <Form.Control
          type="number"
          step="any"
          value={hasInput ? draft : ""}
          isInvalid={hasInput && !valid && draft.trim().length > 0}
          onChange={(event) =>
            dispatch(
              GrblSettingsActions.setDraftValue({
                id: meta.id,
                value: event.target.value,
              })
            )
          }
        />
        {row.isDirty && row.current !== undefined && (
          <Description>Current: {row.current}</Description>
        )}
      </ValueWrapper>
    );
  };

  return (
    <Modal size="lg" centered scrollable show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>GRBL Settings</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <InputGroup className="mb-3">
          <Form.Control
            placeholder="Search settings"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Button variant="outline-secondary" onClick={requestRefresh}>
            {fetchStatus === "loading" ? (
              <Spinner animation="border" size="sm" />
            ) : (
              "Refresh"
            )}
          </Button>
          <Button variant="outline-secondary" onClick={handleResetDraft}>
            Reset
          </Button>
          <Button variant="outline-secondary" onClick={handleImportClick}>
            <BsUpload />
          </Button>
          <Button variant="outline-secondary" onClick={handleExport}>
            <BsDownload />
          </Button>
        </InputGroup>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          style={{ display: "none" }}
          onChange={handleImportChange}
        />
        {error && (
          <div className="mb-2">
            <Badge bg="danger">{error}</Badge>
          </div>
        )}
        <Table striped hover size="sm" responsive>
          <thead>
            <tr>
              <th style={{ width: "22%" }}>Setting</th>
              <th>Description</th>
              <th style={{ width: "24%" }}>Value</th>
              <th style={{ width: "12%" }}>Unit</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(groupedRows).length === 0 && (
              <tr>
                <td colSpan={4}>No settings found.</td>
              </tr>
            )}
            {Object.entries(groupedRows).map(([group, groupRows]) => (
              <Fragment key={group}>
                <GroupRow>
                  <td colSpan={4}>{group}</td>
                </GroupRow>
                {groupRows.map((row) => (
                  <tr key={row.meta.id}>
                    <td>
                      <strong>{row.meta.id}</strong> {row.meta.name}
                    </td>
                    <td>
                      <Description>{row.meta.description}</Description>
                    </td>
                    <td>{renderValueCell(row)}</td>
                    <td>
                      <UnitText>{row.meta.unit ?? ""}</UnitText>
                    </td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </Table>
      </Modal.Body>
      <Modal.Footer>
        {hasInvalidDirty && (
          <Badge bg="warning" text="dark">
            Fix invalid values before saving
          </Badge>
        )}
        {saveStatus === "saving" && (
          <Badge bg="info">Saving…</Badge>
        )}
        {saveStatus === "succeeded" && (
          <Badge bg="success">Saved</Badge>
        )}
        {saveStatus === "failed" && <Badge bg="danger">Save failed</Badge>}
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
        <Button
          variant="primary"
          disabled={!hasDirty || hasInvalidDirty || saveStatus === "saving"}
          onClick={handleSave}
        >
          Save
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
