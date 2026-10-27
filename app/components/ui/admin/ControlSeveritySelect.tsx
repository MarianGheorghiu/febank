"use client";
import OptionSelect from "../dashboard/OptionSelect";
const options = [{ value: "ALL", label: "All severities" }, { value: "CRITICAL", label: "Critical" }, { value: "WARNING", label: "Warning" }, { value: "INFO", label: "Info" }];
export default function ControlSeveritySelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <OptionSelect className="w-40 shrink-0" label="Log severity" value={value} onChange={onChange} options={options}/>;
}
