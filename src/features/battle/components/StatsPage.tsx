import type { CharacterState } from "../../../game/types";
import {
  getCharacterMaxHp,
  getCharacterMaxPp,
} from "../../../game/ghost/ghostSystem";
import { getCharacterPortraitSource } from "../../characterSelect/data/characterOptions";

type Props = {
  characters: CharacterState[];
};

function formLabel(form: CharacterState["form"]) {
  if (form === "ghost") return "Ghost Form";
  if (form === "permanentlyDead") return "Fallen";
  return "Living";
}

export default function StatsPage({ characters }: Props) {
  return (
    <section className="statsPage" aria-label="Character stats">
      <div className="statsPage__panel">
        <header className="statsPage__header">
          <div>
            <div className="statsPage__eyebrow">Party</div>
            <h2>Stats</h2>
          </div>
          <span>Release Shift to close</span>
        </header>

        <div className={`statsPage__characters statsPage__characters--${characters.length}`}>
          {characters.map((character) => (
            <article className="statsPage__character" key={character.instanceId}>
              <div className="statsPage__identity">
                <img
                  src={getCharacterPortraitSource(character)}
                  alt=""
                />
                <div>
                  <h3>{character.name}</h3>
                  <p>
                    Level {character.level} · {formLabel(character.form)}
                  </p>
                </div>
              </div>

              <dl className="statsPage__resources">
                <div>
                  <dt>HP</dt>
                  <dd>{character.hp} / {getCharacterMaxHp(character)}</dd>
                </div>
                <div>
                  <dt>PP</dt>
                  <dd>{character.pp} / {getCharacterMaxPp(character)}</dd>
                </div>
                <div>
                  <dt>Barrier</dt>
                  <dd>{character.barrier}</dd>
                </div>
              </dl>

              <dl className="statsPage__combatStats">
                <div><dt>Attack</dt><dd>{character.stats.attack}</dd></div>
                <div><dt>Defense</dt><dd>{character.stats.defense}</dd></div>
                <div><dt>Resistance</dt><dd>{character.stats.resistance}</dd></div>
                <div><dt>Agility</dt><dd>{character.stats.agility}</dd></div>
                <div className="statsPage__wideStat">
                  <dt>Critical Chance</dt>
                  <dd>{Math.round(character.stats.criticalChance * 100)}%</dd>
                </div>
              </dl>

              <div className="statsPage__sectionTitle">Elemental Power</div>
              <dl className="statsPage__elements">
                <div className="statsPage__element statsPage__element--fire">
                  <dt>Fire Power</dt>
                  <dd>{character.stats.elementalPower.fire}</dd>
                </div>
                <div className="statsPage__element statsPage__element--water">
                  <dt>Water Power</dt>
                  <dd>{character.stats.elementalPower.water}</dd>
                </div>
                <div className="statsPage__element statsPage__element--earth">
                  <dt>Earth Power</dt>
                  <dd>{character.stats.elementalPower.earth}</dd>
                </div>
                <div className="statsPage__element statsPage__element--wind">
                  <dt>Wind Power</dt>
                  <dd>{character.stats.elementalPower.wind}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
