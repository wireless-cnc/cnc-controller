/**
 * G-Code Parser for CNC visualization
 * Parses G-code commands and extracts tool paths
 */

export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface PathSegment {
  type: "rapid" | "linear" | "arc";
  start: Position;
  end: Position;
  feedRate?: number;
  spindleSpeed?: number;
  tool?: number;
  // For arc movements
  center?: Position;
  clockwise?: boolean;
  radius?: number;
  plane?: "XY" | "XZ" | "YZ";
}

export interface ParsedGCode {
  segments: PathSegment[];
  bounds: {
    min: Position;
    max: Position;
  };
  tools: number[];
}

export class GCodeParser {
  private currentPosition: Position = { x: 0, y: 0, z: 0 };
  private absoluteMode = true; // G90 = absolute, G91 = relative
  private currentFeedRate = 0;
  private currentSpindleSpeed = 0;
  private currentTool = 0;
  private currentPlane: "XY" | "XZ" | "YZ" = "XY";

  parse(gcode: string | string[]): ParsedGCode {
    const lines = Array.isArray(gcode) ? gcode : gcode.split("\n");
    const segments: PathSegment[] = [];
    const tools = new Set<number>();
    const allPositions: Position[] = [{ ...this.currentPosition }];

    for (const line of lines) {
      const cleanLine = this.cleanLine(line);
      if (!cleanLine) continue;

      const commands = this.parseCommands(cleanLine);
      const segment = this.processCommands(commands);

      if (segment) {
        segments.push(segment);
        allPositions.push({ ...this.currentPosition });
        if (segment.tool !== undefined) {
          tools.add(segment.tool);
        }
      }

      // Update state from modal commands
      if (commands.G !== undefined) {
        this.updateModalState(commands);
      }
    }

    const bounds = this.calculateBounds(allPositions);

    return {
      segments,
      bounds,
      tools: Array.from(tools),
    };
  }

  private cleanLine(line: string): string {
    // Remove comments
    let cleaned = line.split(";")[0].trim();
    cleaned = cleaned.split("(")[0].trim(); // Remove parenthetical comments
    return cleaned.toUpperCase();
  }

  private parseCommands(
    line: string
  ): Record<string, number | string | undefined> {
    const commands: Record<string, number | string | undefined> = {};
    const regex = /([A-Z])(-?\d+\.?\d*)/g;
    let match;

    while ((match = regex.exec(line)) !== null) {
      const letter = match[1];
      const value = parseFloat(match[2]);
      commands[letter] = value;
    }

    return commands;
  }

  private updateModalState(commands: Record<string, number | string | undefined>): void {
    const G = commands.G;

    if (G === 90) this.absoluteMode = true;
    else if (G === 91) this.absoluteMode = false;

    if (G === 17) this.currentPlane = "XY";
    else if (G === 18) this.currentPlane = "XZ";
    else if (G === 19) this.currentPlane = "YZ";
  }

  private processCommands(
    commands: Record<string, number | string | undefined>
  ): PathSegment | null {
    const G = commands.G;

    // Update position and feed rate
    if (commands.F !== undefined) {
      this.currentFeedRate = commands.F as number;
    }
    if (commands.S !== undefined) {
      this.currentSpindleSpeed = commands.S as number;
    }
    if (commands.T !== undefined) {
      this.currentTool = commands.T as number;
    }

    // Extract new position
    const newPosition = this.extractPosition(commands);

    if (newPosition) {
      const start = { ...this.currentPosition };

      switch (G) {
        case 0:
          // Rapid positioning
          this.currentPosition = newPosition;
          return {
            type: "rapid",
            start,
            end: newPosition,
            feedRate: this.currentFeedRate,
            spindleSpeed: this.currentSpindleSpeed,
            tool: this.currentTool,
          };

        case 1:
          // Linear interpolation
          this.currentPosition = newPosition;
          return {
            type: "linear",
            start,
            end: newPosition,
            feedRate: this.currentFeedRate,
            spindleSpeed: this.currentSpindleSpeed,
            tool: this.currentTool,
          };

        case 2:
        case 3:
          // Arc interpolation (CW/CCW)
          return this.processArc(
            commands,
            start,
            newPosition,
            G === 2
          );

        default:
          // Other G-codes don't generate movement
          if (newPosition) {
            this.currentPosition = newPosition;
          }
          return null;
      }
    }

    return null;
  }

  private extractPosition(commands: Record<string, number | string | undefined>): Position | null {
    const hasMovement = commands.X !== undefined || commands.Y !== undefined || commands.Z !== undefined;

    if (!hasMovement) {
      return null;
    }

    const newPos: Position = { ...this.currentPosition };

    if (commands.X !== undefined) {
      const x = commands.X as number;
      newPos.x = this.absoluteMode ? x : this.currentPosition.x + x;
    }
    if (commands.Y !== undefined) {
      const y = commands.Y as number;
      newPos.y = this.absoluteMode ? y : this.currentPosition.y + y;
    }
    if (commands.Z !== undefined) {
      const z = commands.Z as number;
      newPos.z = this.absoluteMode ? z : this.currentPosition.z + z;
    }

    return newPos;
  }

  private processArc(
    commands: Record<string, number | string | undefined>,
    start: Position,
    end: Position,
    clockwise: boolean
  ): PathSegment {
    const center = this.calculateArcCenter(commands, start, end);

    this.currentPosition = end;

    return {
      type: "arc",
      start,
      end,
      center,
      clockwise,
      feedRate: this.currentFeedRate,
      spindleSpeed: this.currentSpindleSpeed,
      tool: this.currentTool,
      plane: this.currentPlane,
    };
  }

  private calculateArcCenter(
    commands: Record<string, number | string | undefined>,
    start: Position,
    end: Position
  ): Position {
    // Arc center offset from start point
    const I = (commands.I as number) || 0;
    const J = (commands.J as number) || 0;
    const K = (commands.K as number) || 0;

    return {
      x: start.x + I,
      y: start.y + J,
      z: start.z + K,
    };
  }

  private calculateBounds(positions: Position[]): { min: Position; max: Position } {
    const min: Position = { x: Infinity, y: Infinity, z: Infinity };
    const max: Position = { x: -Infinity, y: -Infinity, z: -Infinity };

    for (const pos of positions) {
      min.x = Math.min(min.x, pos.x);
      min.y = Math.min(min.y, pos.y);
      min.z = Math.min(min.z, pos.z);

      max.x = Math.max(max.x, pos.x);
      max.y = Math.max(max.y, pos.y);
      max.z = Math.max(max.z, pos.z);
    }

    // Add padding
    const padding = 10;
    min.x -= padding;
    min.y -= padding;
    min.z -= padding;
    max.x += padding;
    max.y += padding;
    max.z += padding;

    return { min, max };
  }
}
