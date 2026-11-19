import type { FlagDef, Level } from './types';

// Flag artwork: flag-icons by Panayiotis Lipiridis (MIT licence), bundled at build time.
import pk from 'flag-icons/flags/4x3/pk.svg?raw';
import jp from 'flag-icons/flags/4x3/jp.svg?raw';
import bd from 'flag-icons/flags/4x3/bd.svg?raw';
import tr from 'flag-icons/flags/4x3/tr.svg?raw';
import de from 'flag-icons/flags/4x3/de.svg?raw';
import fr from 'flag-icons/flags/4x3/fr.svg?raw';
import it from 'flag-icons/flags/4x3/it.svg?raw';
import ng from 'flag-icons/flags/4x3/ng.svg?raw';
import ua from 'flag-icons/flags/4x3/ua.svg?raw';
import id from 'flag-icons/flags/4x3/id.svg?raw';
import pl from 'flag-icons/flags/4x3/pl.svg?raw';
import ch from 'flag-icons/flags/4x3/ch.svg?raw';
import ie from 'flag-icons/flags/4x3/ie.svg?raw';
import nl from 'flag-icons/flags/4x3/nl.svg?raw';
import at from 'flag-icons/flags/4x3/at.svg?raw';
import ru from 'flag-icons/flags/4x3/ru.svg?raw';
import ca from 'flag-icons/flags/4x3/ca.svg?raw';
import se from 'flag-icons/flags/4x3/se.svg?raw';
import dk from 'flag-icons/flags/4x3/dk.svg?raw';
import fi from 'flag-icons/flags/4x3/fi.svg?raw';
import no from 'flag-icons/flags/4x3/no.svg?raw';
import is from 'flag-icons/flags/4x3/is.svg?raw';
import cn from 'flag-icons/flags/4x3/cn.svg?raw';
import jm from 'flag-icons/flags/4x3/jm.svg?raw';
import za from 'flag-icons/flags/4x3/za.svg?raw';
import gb from 'flag-icons/flags/4x3/gb.svg?raw';
import gr from 'flag-icons/flags/4x3/gr.svg?raw';
import us from 'flag-icons/flags/4x3/us.svg?raw';

const f = (code: string, name: string, level: Level, svg: string): FlagDef => ({ kind: 'flag', id: `flag-${code}`, name, level, svg });

export const FLAGS: FlagDef[] = [
  f('pk', 'Pakistan', 1, pk),
  f('jp', 'Japan', 1, jp),
  f('bd', 'Bangladesh', 1, bd),
  f('tr', 'Türkiye', 1, tr),
  f('de', 'Germany', 1, de),
  f('fr', 'France', 1, fr),
  f('it', 'Italy', 1, it),
  f('ng', 'Nigeria', 1, ng),
  f('ua', 'Ukraine', 1, ua),
  f('id', 'Indonesia', 1, id),
  f('pl', 'Poland', 1, pl),
  f('ch', 'Switzerland', 1, ch),
  f('ie', 'Ireland', 1, ie),
  f('nl', 'Netherlands', 1, nl),
  f('at', 'Austria', 1, at),
  f('ru', 'Russia', 1, ru),
  f('ca', 'Canada', 2, ca),
  f('se', 'Sweden', 2, se),
  f('dk', 'Denmark', 2, dk),
  f('fi', 'Finland', 2, fi),
  f('no', 'Norway', 2, no),
  f('is', 'Iceland', 2, is),
  f('cn', 'China', 2, cn),
  f('jm', 'Jamaica', 2, jm),
  f('za', 'South Africa', 2, za),
  f('gb', 'United Kingdom', 3, gb),
  f('gr', 'Greece', 3, gr),
  f('us', 'USA', 3, us),
];
