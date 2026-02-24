'use client';

import { useState } from 'react';
import { BreakdownTeam, BreakdownPlayer } from '@/hooks/breakdowns';
import { CollectionWorkflow } from '@/hooks/collections';
import { EventGroup } from '@/hooks/eventGroups';
import { useTaggingStore, getPlayersCurrentlyInGame } from '@/store/tagging';

interface Props {
  teams: BreakdownTeam[];
  players: BreakdownPlayer[];
  eventGroups: EventGroup[];
  workflows: CollectionWorkflow[];
}

function sortByJersey(players: BreakdownPlayer[]): BreakdownPlayer[] {
  return [...players].sort((a, b) => {
    const aNum = a.jersey_number !== null ? parseInt(a.jersey_number, 10) : Infinity;
    const bNum = b.jersey_number !== null ? parseInt(b.jersey_number, 10) : Infinity;
    if (aNum !== bNum) return aNum - bNum;
    return (a.player_name ?? '').localeCompare(b.player_name ?? '');
  });
}

function PlayerBtn({ player, onSelect }: { player: BreakdownPlayer; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className="flex items-center gap-1.5 w-full rounded-md bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 px-2 py-2 text-xs text-zinc-100 transition-colors text-left"
    >
      {player.jersey_number && (
        <span className="font-mono text-zinc-500 shrink-0">{player.jersey_number}</span>
      )}
      <span className="truncate">{player.player_name}</span>
    </button>
  );
}

interface TeamColumnProps {
  team: BreakdownTeam;
  inGamePlayers: BreakdownPlayer[];
  benchPlayers: BreakdownPlayer[];
  onSelectTeam: () => void;
  onSelectPlayer: (player: BreakdownPlayer) => void;
}

function TeamColumn({ team, inGamePlayers, benchPlayers, onSelectTeam, onSelectPlayer }: TeamColumnProps) {
  const [benchOpen, setBenchOpen] = useState(false);

  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      {/* Team header — also a selectable button */}
      <button
        onClick={onSelectTeam}
        className="w-full rounded-md bg-zinc-700 hover:bg-zinc-600 active:bg-zinc-500 px-2 py-2 text-xs font-semibold text-zinc-200 truncate transition-colors text-center"
        title={team.team_name ?? team.team_abbreviation ?? 'Team'}
      >
        {team.team_abbreviation ?? team.team_name ?? 'Team'}
      </button>

      {/* In-game players */}
      {inGamePlayers.map((p) => (
        <PlayerBtn key={p.id} player={p} onSelect={() => onSelectPlayer(p)} />
      ))}

      {/* Bench (collapsible) */}
      {benchPlayers.length > 0 && (
        <>
          <button
            onClick={() => setBenchOpen((o) => !o)}
            className="w-full text-left px-2 py-1 text-xs text-zinc-600 hover:text-zinc-400 transition-colors flex items-center gap-1"
          >
            <span>{benchOpen ? '▾' : '▸'}</span>
            <span>Bench ({benchPlayers.length})</span>
          </button>
          {benchOpen && benchPlayers.map((p) => (
            <PlayerBtn key={p.id} player={p} onSelect={() => onSelectPlayer(p)} />
          ))}
        </>
      )}
    </div>
  );
}

export function ParticipantPicker({ teams, players, eventGroups, workflows }: Props) {
  const participantPrompt = useTaggingStore((s) => s.participantPrompt);
  const selectedTimestamp = useTaggingStore((s) => s.selectedTimestamp) ?? 0;
  const selectParticipant = useTaggingStore((s) => s.selectParticipant);

  const lineupWorkflow = workflows.find((w) => w.system_reserved) ?? null;
  const isMatchup = teams.length >= 2;

  const inGameIds = lineupWorkflow
    ? getPlayersCurrentlyInGame(eventGroups, lineupWorkflow.id, selectedTimestamp)
    : [];

  function handleSelectPlayer(player: BreakdownPlayer) {
    selectParticipant(player.id, player.player_name ?? null, false);
  }

  function handleSelectTeam(team: BreakdownTeam) {
    selectParticipant(team.id, team.team_name ?? team.team_abbreviation ?? 'Team', true);
  }

  // Matchup mode: two-column layout (away left, home right)
  if (isMatchup) {
    const awayTeam = teams.find((t) => t.home_away === 'away') ?? teams[0];
    const homeTeam = teams.find((t) => t.home_away === 'home') ?? teams[1];

    function teamPlayers(team: BreakdownTeam) {
      return players.filter((p) => p.breakdown_team_id === team.id);
    }

    function splitPlayers(team: BreakdownTeam) {
      const all = sortByJersey(teamPlayers(team));
      return {
        inGame: all.filter((p) => inGameIds.includes(p.id)),
        bench: all.filter((p) => !inGameIds.includes(p.id)),
      };
    }

    const away = splitPlayers(awayTeam);
    const home = splitPlayers(homeTeam);

    return (
      <div className="space-y-3">
        <p className="text-sm font-medium text-zinc-300 leading-snug">
          {participantPrompt ?? 'Who?'}
        </p>

        <div className="grid grid-cols-2 gap-2">
          <TeamColumn
            team={awayTeam}
            inGamePlayers={away.inGame}
            benchPlayers={away.bench}
            onSelectTeam={() => handleSelectTeam(awayTeam)}
            onSelectPlayer={handleSelectPlayer}
          />
          <TeamColumn
            team={homeTeam}
            inGamePlayers={home.inGame}
            benchPlayers={home.bench}
            onSelectTeam={() => handleSelectTeam(homeTeam)}
            onSelectPlayer={handleSelectPlayer}
          />
        </div>

        <button
          onClick={() => selectParticipant(null, null, false)}
          className="w-full text-xs text-zinc-600 hover:text-zinc-400 transition-colors py-1.5 border-t border-zinc-800 text-center"
        >
          No attribution
        </button>
      </div>
    );
  }

  // Non-matchup mode: single list, in-game first
  const sorted = sortByJersey(players);
  const inGamePlayers = sorted.filter((p) => inGameIds.includes(p.id));
  const benchPlayers = sorted.filter((p) => !inGameIds.includes(p.id));

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-zinc-300 leading-snug">
        {participantPrompt ?? 'Who?'}
      </p>

      {inGamePlayers.length > 0 && (
        <div>
          <p className="text-xs text-zinc-500 mb-1.5">In Game</p>
          <div className="flex flex-col gap-1.5">
            {inGamePlayers.map((p) => (
              <PlayerBtn key={p.id} player={p} onSelect={() => handleSelectPlayer(p)} />
            ))}
          </div>
        </div>
      )}

      {benchPlayers.length > 0 && (
        <div>
          <p className="text-xs text-zinc-500 mb-1.5">
            {inGamePlayers.length > 0 ? 'Other Players' : 'Players'}
          </p>
          <div className="flex flex-col gap-1.5">
            {benchPlayers.map((p) => (
              <PlayerBtn key={p.id} player={p} onSelect={() => handleSelectPlayer(p)} />
            ))}
          </div>
        </div>
      )}

      {teams.length === 1 && (
        <div>
          <p className="text-xs text-zinc-500 mb-1.5">Team</p>
          <button
            onClick={() => handleSelectTeam(teams[0])}
            className="w-full rounded-md bg-zinc-800 hover:bg-zinc-700 px-3 py-2.5 text-sm text-zinc-100 transition-colors text-left"
          >
            {teams[0].team_name ?? teams[0].team_abbreviation ?? 'Team'}
          </button>
        </div>
      )}

      <button
        onClick={() => selectParticipant(null, null, false)}
        className="w-full text-xs text-zinc-600 hover:text-zinc-400 transition-colors py-2 border-t border-zinc-800 text-center"
      >
        No attribution
      </button>
    </div>
  );
}
