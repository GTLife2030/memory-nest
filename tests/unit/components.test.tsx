import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  Button,
  DemoBadge,
  IconButton,
  ProgressGentle,
  RecordButton,
  StoryCard,
  Waveform,
} from "@/components/ui";

const labels = { idle: "Tik om te vertellen", recording: "Ik luister", paused: "Gepauzeerd" };

describe("RecordButton", () => {
  it("has a visible text label in every state and reports its pressed state", async () => {
    const onToggle = vi.fn();
    const { rerender } = render(<RecordButton state="idle" onToggle={onToggle} labels={labels} />);
    const button = screen.getByRole("button", { name: "Tik om te vertellen" });
    expect(button).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(button);
    expect(onToggle).toHaveBeenCalledOnce();

    rerender(<RecordButton state="recording" onToggle={onToggle} labels={labels} elapsed="0:34" />);
    expect(screen.getByRole("button", { name: "Ik luister" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("timer")).toHaveTextContent("0:34");
  });

  it("shows no countdown or limit", () => {
    render(
      <RecordButton state="recording" onToggle={() => undefined} labels={labels} elapsed="12:05" />,
    );
    expect(screen.queryByText(/nog|resterend|max/i)).toBeNull();
  });
});

describe("ProgressGentle", () => {
  it("exposes position as a sentence, not a percentage or streak", () => {
    render(<ProgressGentle done={3} total={8} label="3 van de 8 verhalen staan in het boek" />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "3");
    expect(bar).toHaveAttribute("aria-valuemax", "8");
    expect(bar).toHaveAttribute("aria-valuetext", "3 van de 8 verhalen staan in het boek");
    expect(document.body.textContent).not.toMatch(/%/);
  });

  it("clamps impossible values", () => {
    render(<ProgressGentle done={12} total={0} label="x" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");
  });
});

describe("buttons", () => {
  it("IconButton takes its accessible name from the required label", () => {
    render(<IconButton label="Afspelen">▶</IconButton>);
    expect(screen.getByRole("button", { name: "Afspelen" })).toBeInTheDocument();
  });

  it("Button never submits a form by accident", () => {
    render(<Button>Vertel het</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });
});

describe("StoryCard", () => {
  it("makes the whole card one link named after the story and shows the AI label until approved", () => {
    render(
      <StoryCard
        title="De bakkerij"
        href="/v/1"
        meta="Oma Truus"
        excerpt="Mijn vader…"
        aiLabel="bewerkt met AI"
      />,
    );
    expect(screen.getByRole("link", { name: "De bakkerij" })).toHaveAttribute("href", "/v/1");
    expect(screen.getByText("bewerkt met AI")).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });
});

describe("Waveform and DemoBadge", () => {
  it("Waveform is an image with a text alternative and tolerates bad levels", () => {
    render(
      <Waveform levels={[0, 0.5, 2, -1]} label="Geluidsfragment van 34 seconden" progress={5} />,
    );
    const image = screen.getByRole("img", { name: "Geluidsfragment van 34 seconden" });
    expect(image.querySelectorAll("rect")).toHaveLength(4);
  });

  it("DemoBadge tells screen readers which services are simulated", () => {
    render(<DemoBadge label="demo-modus" detail="Nagebootst: betalen" />);
    expect(screen.getByTestId("demo-badge")).toHaveTextContent("demo-modus");
    expect(screen.getByTestId("demo-badge")).toHaveTextContent("Nagebootst: betalen");
  });
});
