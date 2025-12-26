/**
 * @file Tests for HTML filtering rules.
 */
import {
    beforeAll,
    describe,
    expect,
    test,
} from 'vitest';

import { type AdblockTokenizer, getAdblockTokenizer } from '../../../utils/get-adblock-tokenizer';

let tokenizer: AdblockTokenizer;

// Before running any tests, we should load the grammar and get the tokenizer
beforeAll(async () => {
    tokenizer = await getAdblockTokenizer();
});

/**
 * Below are scope definitions used in the tests.
 */
const ROOT = ['text.adblock'];
const INVALID = [...ROOT, 'invalid.illegal.adblock'];
const SEPARATOR = [...ROOT, 'keyword.control.adblock'];
const COMBINATOR = [...ROOT, 'keyword.operator.combinator.css'];
const COMMA = [...ROOT, 'punctuation.separator.list.comma.css'];
const UNIVERSAL_TYPE_SELECTOR = [...ROOT, 'entity.name.tag.wildcard.css'];
const TYPE_SELECTOR = [...ROOT, 'entity.name.tag.css'];
const ID_SELECTOR = [...ROOT, 'entity.other.attribute-name.id.css'];
const ID_SELECTOR_PREFIX = [...ID_SELECTOR, 'punctuation.definition.entity.css'];
const CLASS_SELECTOR = [...ROOT, 'entity.other.attribute-name.class.css'];
const CLASS_SELECTOR_PREFIX = [...CLASS_SELECTOR, 'punctuation.definition.entity.css'];
const ATTRIBUTE_SELECTOR = [...ROOT, 'meta.attribute-selector.css'];
const ATTRIBUTE_SELECTOR_OPEN = [...ATTRIBUTE_SELECTOR, 'punctuation.definition.entity.begin.bracket.square.css'];
const ATTRIBUTE_SELECTOR_CLOSE = [...ATTRIBUTE_SELECTOR, 'punctuation.definition.entity.end.bracket.square.css'];
const ATTRIBUTE_SELECTOR_NAME = [...ATTRIBUTE_SELECTOR, 'entity.other.attribute-name.css'];
const ATTRIBUTE_SELECTOR_OPERATOR = [...ATTRIBUTE_SELECTOR, 'keyword.operator.pattern.css'];
const ATTRIBUTE_SELECTOR_DOUBLE = [...ATTRIBUTE_SELECTOR, 'string.quoted.double.css'];
const ATTRIBUTE_SELECTOR_DOUBLE_OPEN = [...ATTRIBUTE_SELECTOR_DOUBLE, 'punctuation.definition.string.begin.css'];
const ATTRIBUTE_SELECTOR_DOUBLE_CLOSE = [...ATTRIBUTE_SELECTOR_DOUBLE, 'punctuation.definition.string.end.css'];
const ATTRIBUTE_SELECTOR_SINGLE = [...ATTRIBUTE_SELECTOR, 'string.quoted.single.css'];
const ATTRIBUTE_SELECTOR_SINGLE_OPEN = [...ATTRIBUTE_SELECTOR_SINGLE, 'punctuation.definition.string.begin.css'];
const ATTRIBUTE_SELECTOR_SINGLE_CLOSE = [...ATTRIBUTE_SELECTOR_SINGLE, 'punctuation.definition.string.end.css'];
const ATTRIBUTE_SELECTOR_UNQUOTED = [...ATTRIBUTE_SELECTOR, 'string.unquoted.attribute-value.css'];
const ATTRIBUTE_SELECTOR_FLAG = [...ATTRIBUTE_SELECTOR, 'keyword.other.flag.css'];
const PSEUDO_ELEMENT = [...ROOT, 'entity.other.attribute-name.pseudo-element.css'];
const PSEUDO_ELEMENT_PREFIX = [...PSEUDO_ELEMENT, 'punctuation.definition.entity.css'];
const PSEUDO_CLASS = [...ROOT, 'entity.other.attribute-name.pseudo-class.css'];
const PSEUDO_CLASS_PREFIX = [...PSEUDO_CLASS, 'punctuation.definition.entity.css'];
const PSEUDO_CLASS_OPEN = [...PSEUDO_CLASS, 'punctuation.section.function.begin.bracket.round.css'];
const PSEUDO_CLASS_CLOSE = [...PSEUDO_CLASS, 'punctuation.section.function.end.bracket.round.css'];
const PSEUDO_CLASS_DOUBLE = [...PSEUDO_CLASS, 'string.quoted.double.css'];
const PSEUDO_CLASS_DOUBLE_OPEN = [...PSEUDO_CLASS_DOUBLE, 'punctuation.definition.string.begin.css'];
const PSEUDO_CLASS_DOUBLE_CLOSE = [...PSEUDO_CLASS_DOUBLE, 'punctuation.definition.string.end.css'];
const PSEUDO_CLASS_SINGLE = [...PSEUDO_CLASS, 'string.quoted.single.css'];
const PSEUDO_CLASS_SINGLE_OPEN = [...PSEUDO_CLASS_SINGLE, 'punctuation.definition.string.begin.css'];
const PSEUDO_CLASS_SINGLE_CLOSE = [...PSEUDO_CLASS_SINGLE, 'punctuation.definition.string.end.css'];
const PSEUDO_CLASS_REGEXP = [...PSEUDO_CLASS, 'string.regexp.js'];
const PSEUDO_CLASS_REGEXP_OPEN = [...PSEUDO_CLASS_REGEXP, 'punctuation.definition.string.begin.js'];
const PSEUDO_CLASS_REGEXP_CLOSE = [...PSEUDO_CLASS_REGEXP, 'punctuation.definition.string.end.js'];
const PSEUDO_CLASS_REGEXP_FLAGS = [...PSEUDO_CLASS_REGEXP, 'keyword.other.regex'];
const PSEUDO_CLASS_UNQUOTED = [...PSEUDO_CLASS, 'constant.numeric.css'];

describe('HTML filtering rules', () => {
    describe('HTML filtering rule - valid cases', () => {
        test.each([
            {
                actual: '$$*, div, custom-tag, -weird-tag, _weird-tag, -_weird-tag, weird-tag-2',
                expected: [
                    { fragment: '$$', scopes: SEPARATOR },
                    { fragment: '*', scopes: UNIVERSAL_TYPE_SELECTOR },
                    { fragment: ',', scopes: COMMA },
                    { fragment: ' ', scopes: ROOT },
                    { fragment: 'div', scopes: TYPE_SELECTOR },
                    { fragment: ',', scopes: COMMA },
                    { fragment: ' ', scopes: ROOT },
                    { fragment: 'custom-tag', scopes: TYPE_SELECTOR },
                    { fragment: ',', scopes: COMMA },
                    { fragment: ' ', scopes: ROOT },
                    { fragment: '-weird-tag', scopes: TYPE_SELECTOR },
                    { fragment: ',', scopes: COMMA },
                    { fragment: ' ', scopes: ROOT },
                    { fragment: '_weird-tag', scopes: TYPE_SELECTOR },
                    { fragment: ',', scopes: COMMA },
                    { fragment: ' ', scopes: ROOT },
                    { fragment: '-_weird-tag', scopes: TYPE_SELECTOR },
                    { fragment: ',', scopes: COMMA },
                    { fragment: ' ', scopes: ROOT },
                    { fragment: 'weird-tag-2', scopes: TYPE_SELECTOR },
                ],
            },
            {
                actual: '$$#id, #test-id, #test-id-2, #-weird-id, #_weird-id, #-_weird-id',
                expected: [
                    { fragment: '$$', scopes: SEPARATOR },
                    { fragment: '#', scopes: ID_SELECTOR_PREFIX },
                    { fragment: 'id', scopes: ID_SELECTOR },
                    { fragment: ',', scopes: COMMA },
                    { fragment: ' ', scopes: ROOT },
                    { fragment: '#', scopes: ID_SELECTOR_PREFIX },
                    { fragment: 'test-id', scopes: ID_SELECTOR },
                    { fragment: ',', scopes: COMMA },
                    { fragment: ' ', scopes: ROOT },
                    { fragment: '#', scopes: ID_SELECTOR_PREFIX },
                    { fragment: 'test-id-2', scopes: ID_SELECTOR },
                    { fragment: ',', scopes: COMMA },
                    { fragment: ' ', scopes: ROOT },
                    { fragment: '#', scopes: ID_SELECTOR_PREFIX },
                    { fragment: '-weird-id', scopes: ID_SELECTOR },
                    { fragment: ',', scopes: COMMA },
                    { fragment: ' ', scopes: ROOT },
                    { fragment: '#', scopes: ID_SELECTOR_PREFIX },
                    { fragment: '_weird-id', scopes: ID_SELECTOR },
                    { fragment: ',', scopes: COMMA },
                    { fragment: ' ', scopes: ROOT },
                    { fragment: '#', scopes: ID_SELECTOR_PREFIX },
                    { fragment: '-_weird-id', scopes: ID_SELECTOR },
                ],
            },
            {
                actual: '$$.class, .test-class, .test-class-2, .-weird-class, ._weird-class, .-_weird-class',
                expected: [
                    { fragment: '$$', scopes: SEPARATOR },
                    { fragment: '.', scopes: CLASS_SELECTOR_PREFIX },
                    { fragment: 'class', scopes: CLASS_SELECTOR },
                    { fragment: ',', scopes: COMMA },
                    { fragment: ' ', scopes: ROOT },
                    { fragment: '.', scopes: CLASS_SELECTOR_PREFIX },
                    { fragment: 'test-class', scopes: CLASS_SELECTOR },
                    { fragment: ',', scopes: COMMA },
                    { fragment: ' ', scopes: ROOT },
                    { fragment: '.', scopes: CLASS_SELECTOR_PREFIX },
                    { fragment: 'test-class-2', scopes: CLASS_SELECTOR },
                    { fragment: ',', scopes: COMMA },
                    { fragment: ' ', scopes: ROOT },
                    { fragment: '.', scopes: CLASS_SELECTOR_PREFIX },
                    { fragment: '-weird-class', scopes: CLASS_SELECTOR },
                    { fragment: ',', scopes: COMMA },
                    { fragment: ' ', scopes: ROOT },
                    { fragment: '.', scopes: CLASS_SELECTOR_PREFIX },
                    { fragment: '_weird-class', scopes: CLASS_SELECTOR },
                    { fragment: ',', scopes: COMMA },
                    { fragment: ' ', scopes: ROOT },
                    { fragment: '.', scopes: CLASS_SELECTOR_PREFIX },
                    { fragment: '-_weird-class', scopes: CLASS_SELECTOR },
                ],
            },
            {
                actual: '$$[attr][attr-name][attr-name-2][-weird-attr][_weird-attr][-_weird-attr]',
                expected: [
                    { fragment: '$$', scopes: SEPARATOR },
                    { fragment: '[', scopes: ATTRIBUTE_SELECTOR_OPEN },
                    { fragment: 'attr', scopes: ATTRIBUTE_SELECTOR_NAME },
                    { fragment: ']', scopes: ATTRIBUTE_SELECTOR_CLOSE },
                    { fragment: '[', scopes: ATTRIBUTE_SELECTOR_OPEN },
                    { fragment: 'attr-name', scopes: ATTRIBUTE_SELECTOR_NAME },
                    { fragment: ']', scopes: ATTRIBUTE_SELECTOR_CLOSE },
                    { fragment: '[', scopes: ATTRIBUTE_SELECTOR_OPEN },
                    { fragment: 'attr-name-2', scopes: ATTRIBUTE_SELECTOR_NAME },
                    { fragment: ']', scopes: ATTRIBUTE_SELECTOR_CLOSE },
                    { fragment: '[', scopes: ATTRIBUTE_SELECTOR_OPEN },
                    { fragment: '-weird-attr', scopes: ATTRIBUTE_SELECTOR_NAME },
                    { fragment: ']', scopes: ATTRIBUTE_SELECTOR_CLOSE },
                    { fragment: '[', scopes: ATTRIBUTE_SELECTOR_OPEN },
                    { fragment: '_weird-attr', scopes: ATTRIBUTE_SELECTOR_NAME },
                    { fragment: ']', scopes: ATTRIBUTE_SELECTOR_CLOSE },
                    { fragment: '[', scopes: ATTRIBUTE_SELECTOR_OPEN },
                    { fragment: '-_weird-attr', scopes: ATTRIBUTE_SELECTOR_NAME },
                    { fragment: ']', scopes: ATTRIBUTE_SELECTOR_CLOSE },
                ],
            },
            {
                actual: '$$[attr1][attr2="value2"][attr3=\'value3\'][attr4=value4]',
                expected: [
                    { fragment: '$$', scopes: SEPARATOR },
                    { fragment: '[', scopes: ATTRIBUTE_SELECTOR_OPEN },
                    { fragment: 'attr1', scopes: ATTRIBUTE_SELECTOR_NAME },
                    { fragment: ']', scopes: ATTRIBUTE_SELECTOR_CLOSE },
                    { fragment: '[', scopes: ATTRIBUTE_SELECTOR_OPEN },
                    { fragment: 'attr2', scopes: ATTRIBUTE_SELECTOR_NAME },
                    { fragment: '=', scopes: ATTRIBUTE_SELECTOR_OPERATOR },
                    { fragment: '"', scopes: ATTRIBUTE_SELECTOR_DOUBLE_OPEN },
                    { fragment: 'value2', scopes: ATTRIBUTE_SELECTOR_DOUBLE },
                    { fragment: '"', scopes: ATTRIBUTE_SELECTOR_DOUBLE_CLOSE },
                    { fragment: ']', scopes: ATTRIBUTE_SELECTOR_CLOSE },
                    { fragment: '[', scopes: ATTRIBUTE_SELECTOR_OPEN },
                    { fragment: 'attr3', scopes: ATTRIBUTE_SELECTOR_NAME },
                    { fragment: '=', scopes: ATTRIBUTE_SELECTOR_OPERATOR },
                    { fragment: '\'', scopes: ATTRIBUTE_SELECTOR_SINGLE_OPEN },
                    { fragment: 'value3', scopes: ATTRIBUTE_SELECTOR_SINGLE },
                    { fragment: '\'', scopes: ATTRIBUTE_SELECTOR_SINGLE_CLOSE },
                    { fragment: ']', scopes: ATTRIBUTE_SELECTOR_CLOSE },
                    { fragment: '[', scopes: ATTRIBUTE_SELECTOR_OPEN },
                    { fragment: 'attr4', scopes: ATTRIBUTE_SELECTOR_NAME },
                    { fragment: '=', scopes: ATTRIBUTE_SELECTOR_OPERATOR },
                    { fragment: 'value4', scopes: ATTRIBUTE_SELECTOR_UNQUOTED },
                    { fragment: ']', scopes: ATTRIBUTE_SELECTOR_CLOSE },
                ],
            },
            {
                actual: '$$[attr1~="value1"][attr2|=\'value2\'][attr3^=value3][attr4$="value4"][attr5*="value5"]',
                expected: [
                    { fragment: '$$', scopes: SEPARATOR },
                    { fragment: '[', scopes: ATTRIBUTE_SELECTOR_OPEN },
                    { fragment: 'attr1', scopes: ATTRIBUTE_SELECTOR_NAME },
                    { fragment: '~=', scopes: ATTRIBUTE_SELECTOR_OPERATOR },
                    { fragment: '"', scopes: ATTRIBUTE_SELECTOR_DOUBLE_OPEN },
                    { fragment: 'value1', scopes: ATTRIBUTE_SELECTOR_DOUBLE },
                    { fragment: '"', scopes: ATTRIBUTE_SELECTOR_DOUBLE_CLOSE },
                    { fragment: ']', scopes: ATTRIBUTE_SELECTOR_CLOSE },
                    { fragment: '[', scopes: ATTRIBUTE_SELECTOR_OPEN },
                    { fragment: 'attr2', scopes: ATTRIBUTE_SELECTOR_NAME },
                    { fragment: '|=', scopes: ATTRIBUTE_SELECTOR_OPERATOR },
                    { fragment: '\'', scopes: ATTRIBUTE_SELECTOR_SINGLE_OPEN },
                    { fragment: 'value2', scopes: ATTRIBUTE_SELECTOR_SINGLE },
                    { fragment: '\'', scopes: ATTRIBUTE_SELECTOR_SINGLE_CLOSE },
                    { fragment: ']', scopes: ATTRIBUTE_SELECTOR_CLOSE },
                    { fragment: '[', scopes: ATTRIBUTE_SELECTOR_OPEN },
                    { fragment: 'attr3', scopes: ATTRIBUTE_SELECTOR_NAME },
                    { fragment: '^=', scopes: ATTRIBUTE_SELECTOR_OPERATOR },
                    { fragment: 'value3', scopes: ATTRIBUTE_SELECTOR_UNQUOTED },
                    { fragment: ']', scopes: ATTRIBUTE_SELECTOR_CLOSE },
                    { fragment: '[', scopes: ATTRIBUTE_SELECTOR_OPEN },
                    { fragment: 'attr4', scopes: ATTRIBUTE_SELECTOR_NAME },
                    { fragment: '$=', scopes: ATTRIBUTE_SELECTOR_OPERATOR },
                    { fragment: '"', scopes: ATTRIBUTE_SELECTOR_DOUBLE_OPEN },
                    { fragment: 'value4', scopes: ATTRIBUTE_SELECTOR_DOUBLE },
                    { fragment: '"', scopes: ATTRIBUTE_SELECTOR_DOUBLE_CLOSE },
                    { fragment: ']', scopes: ATTRIBUTE_SELECTOR_CLOSE },
                    { fragment: '[', scopes: ATTRIBUTE_SELECTOR_OPEN },
                    { fragment: 'attr5', scopes: ATTRIBUTE_SELECTOR_NAME },
                    { fragment: '*=', scopes: ATTRIBUTE_SELECTOR_OPERATOR },
                    { fragment: '"', scopes: ATTRIBUTE_SELECTOR_DOUBLE_OPEN },
                    { fragment: 'value5', scopes: ATTRIBUTE_SELECTOR_DOUBLE },
                    { fragment: '"', scopes: ATTRIBUTE_SELECTOR_DOUBLE_CLOSE },
                    { fragment: ']', scopes: ATTRIBUTE_SELECTOR_CLOSE },
                ],
            },
            {
                actual: '$$[attr1="value1" i][attr2=\'value2\' s][attr3=value3 i]',
                expected: [
                    { fragment: '$$', scopes: SEPARATOR },
                    { fragment: '[', scopes: ATTRIBUTE_SELECTOR_OPEN },
                    { fragment: 'attr1', scopes: ATTRIBUTE_SELECTOR_NAME },
                    { fragment: '=', scopes: ATTRIBUTE_SELECTOR_OPERATOR },
                    { fragment: '"', scopes: ATTRIBUTE_SELECTOR_DOUBLE_OPEN },
                    { fragment: 'value1', scopes: ATTRIBUTE_SELECTOR_DOUBLE },
                    { fragment: '"', scopes: ATTRIBUTE_SELECTOR_DOUBLE_CLOSE },
                    { fragment: ' ', scopes: ATTRIBUTE_SELECTOR },
                    { fragment: 'i', scopes: ATTRIBUTE_SELECTOR_FLAG },
                    { fragment: ']', scopes: ATTRIBUTE_SELECTOR_CLOSE },
                    { fragment: '[', scopes: ATTRIBUTE_SELECTOR_OPEN },
                    { fragment: 'attr2', scopes: ATTRIBUTE_SELECTOR_NAME },
                    { fragment: '=', scopes: ATTRIBUTE_SELECTOR_OPERATOR },
                    { fragment: '\'', scopes: ATTRIBUTE_SELECTOR_SINGLE_OPEN },
                    { fragment: 'value2', scopes: ATTRIBUTE_SELECTOR_SINGLE },
                    { fragment: '\'', scopes: ATTRIBUTE_SELECTOR_SINGLE_CLOSE },
                    { fragment: ' ', scopes: ATTRIBUTE_SELECTOR },
                    { fragment: 's', scopes: ATTRIBUTE_SELECTOR_FLAG },
                    { fragment: ']', scopes: ATTRIBUTE_SELECTOR_CLOSE },
                    { fragment: '[', scopes: ATTRIBUTE_SELECTOR_OPEN },
                    { fragment: 'attr3', scopes: ATTRIBUTE_SELECTOR_NAME },
                    { fragment: '=', scopes: ATTRIBUTE_SELECTOR_OPERATOR },
                    { fragment: 'value3', scopes: ATTRIBUTE_SELECTOR_UNQUOTED },
                    { fragment: ' ', scopes: ATTRIBUTE_SELECTOR },
                    { fragment: 'i', scopes: ATTRIBUTE_SELECTOR_FLAG },
                    { fragment: ']', scopes: ATTRIBUTE_SELECTOR_CLOSE },
                ],
            },
            {
                actual: '$$[attr1="value \\" 1"][attr2="value "" 2"][attr3=\'value \\\' 3\']',
                expected: [
                    { fragment: '$$', scopes: SEPARATOR },
                    { fragment: '[', scopes: ATTRIBUTE_SELECTOR_OPEN },
                    { fragment: 'attr1', scopes: ATTRIBUTE_SELECTOR_NAME },
                    { fragment: '=', scopes: ATTRIBUTE_SELECTOR_OPERATOR },
                    { fragment: '"', scopes: ATTRIBUTE_SELECTOR_DOUBLE_OPEN },
                    { fragment: 'value \\" 1', scopes: ATTRIBUTE_SELECTOR_DOUBLE },
                    { fragment: '"', scopes: ATTRIBUTE_SELECTOR_DOUBLE_CLOSE },
                    { fragment: ']', scopes: ATTRIBUTE_SELECTOR_CLOSE },
                    { fragment: '[', scopes: ATTRIBUTE_SELECTOR_OPEN },
                    { fragment: 'attr2', scopes: ATTRIBUTE_SELECTOR_NAME },
                    { fragment: '=', scopes: ATTRIBUTE_SELECTOR_OPERATOR },
                    { fragment: '"', scopes: ATTRIBUTE_SELECTOR_DOUBLE_OPEN },
                    { fragment: 'value "" 2', scopes: ATTRIBUTE_SELECTOR_DOUBLE },
                    { fragment: '"', scopes: ATTRIBUTE_SELECTOR_DOUBLE_CLOSE },
                    { fragment: ']', scopes: ATTRIBUTE_SELECTOR_CLOSE },
                    { fragment: '[', scopes: ATTRIBUTE_SELECTOR_OPEN },
                    { fragment: 'attr3', scopes: ATTRIBUTE_SELECTOR_NAME },
                    { fragment: '=', scopes: ATTRIBUTE_SELECTOR_OPERATOR },
                    { fragment: '\'', scopes: ATTRIBUTE_SELECTOR_SINGLE_OPEN },
                    { fragment: 'value \\\' 3', scopes: ATTRIBUTE_SELECTOR_SINGLE },
                    { fragment: '\'', scopes: ATTRIBUTE_SELECTOR_SINGLE_CLOSE },
                    { fragment: ']', scopes: ATTRIBUTE_SELECTOR_CLOSE },
                ],
            },
            {
                actual: '$$[ attr1 = "value1" i ][ attr2 ~= \'value2\' s ][ attr3 $= value3 i ]',
                expected: [
                    { fragment: '$$', scopes: SEPARATOR },
                    { fragment: '[', scopes: ATTRIBUTE_SELECTOR_OPEN },
                    { fragment: ' ', scopes: ATTRIBUTE_SELECTOR },
                    { fragment: 'attr1', scopes: ATTRIBUTE_SELECTOR_NAME },
                    { fragment: ' ', scopes: ATTRIBUTE_SELECTOR },
                    { fragment: '=', scopes: ATTRIBUTE_SELECTOR_OPERATOR },
                    { fragment: ' ', scopes: ATTRIBUTE_SELECTOR },
                    { fragment: '"', scopes: ATTRIBUTE_SELECTOR_DOUBLE_OPEN },
                    { fragment: 'value1', scopes: ATTRIBUTE_SELECTOR_DOUBLE },
                    { fragment: '"', scopes: ATTRIBUTE_SELECTOR_DOUBLE_CLOSE },
                    { fragment: ' ', scopes: ATTRIBUTE_SELECTOR },
                    { fragment: 'i', scopes: ATTRIBUTE_SELECTOR_FLAG },
                    { fragment: ' ', scopes: ATTRIBUTE_SELECTOR },
                    { fragment: ']', scopes: ATTRIBUTE_SELECTOR_CLOSE },
                    { fragment: '[', scopes: ATTRIBUTE_SELECTOR_OPEN },
                    { fragment: ' ', scopes: ATTRIBUTE_SELECTOR },
                    { fragment: 'attr2', scopes: ATTRIBUTE_SELECTOR_NAME },
                    { fragment: ' ', scopes: ATTRIBUTE_SELECTOR },
                    { fragment: '~=', scopes: ATTRIBUTE_SELECTOR_OPERATOR },
                    { fragment: ' ', scopes: ATTRIBUTE_SELECTOR },
                    { fragment: '\'', scopes: ATTRIBUTE_SELECTOR_SINGLE_OPEN },
                    { fragment: 'value2', scopes: ATTRIBUTE_SELECTOR_SINGLE },
                    { fragment: '\'', scopes: ATTRIBUTE_SELECTOR_SINGLE_CLOSE },
                    { fragment: ' ', scopes: ATTRIBUTE_SELECTOR },
                    { fragment: 's', scopes: ATTRIBUTE_SELECTOR_FLAG },
                    { fragment: ' ', scopes: ATTRIBUTE_SELECTOR },
                    { fragment: ']', scopes: ATTRIBUTE_SELECTOR_CLOSE },
                    { fragment: '[', scopes: ATTRIBUTE_SELECTOR_OPEN },
                    { fragment: ' ', scopes: ATTRIBUTE_SELECTOR },
                    { fragment: 'attr3', scopes: ATTRIBUTE_SELECTOR_NAME },
                    { fragment: ' ', scopes: ATTRIBUTE_SELECTOR },
                    { fragment: '$=', scopes: ATTRIBUTE_SELECTOR_OPERATOR },
                    { fragment: ' ', scopes: ATTRIBUTE_SELECTOR },
                    { fragment: 'value3', scopes: ATTRIBUTE_SELECTOR_UNQUOTED },
                    { fragment: ' ', scopes: ATTRIBUTE_SELECTOR },
                    { fragment: 'i', scopes: ATTRIBUTE_SELECTOR_FLAG },
                    { fragment: ' ', scopes: ATTRIBUTE_SELECTOR },
                    { fragment: ']', scopes: ATTRIBUTE_SELECTOR_CLOSE },
                ],
            },
            {
                actual: '$$::element, ::test-element, ::-weird-element, ::_weird-element, ::-_weird-element',
                expected: [
                    { fragment: '$$', scopes: SEPARATOR },
                    { fragment: '::', scopes: PSEUDO_ELEMENT_PREFIX },
                    { fragment: 'element', scopes: PSEUDO_ELEMENT },
                    { fragment: ',', scopes: COMMA },
                    { fragment: ' ', scopes: ROOT },
                    { fragment: '::', scopes: PSEUDO_ELEMENT_PREFIX },
                    { fragment: 'test-element', scopes: PSEUDO_ELEMENT },
                    { fragment: ',', scopes: COMMA },
                    { fragment: ' ', scopes: ROOT },
                    { fragment: '::', scopes: PSEUDO_ELEMENT_PREFIX },
                    { fragment: '-weird-element', scopes: PSEUDO_ELEMENT },
                    { fragment: ',', scopes: COMMA },
                    { fragment: ' ', scopes: ROOT },
                    { fragment: '::', scopes: PSEUDO_ELEMENT_PREFIX },
                    { fragment: '_weird-element', scopes: PSEUDO_ELEMENT },
                    { fragment: ',', scopes: COMMA },
                    { fragment: ' ', scopes: ROOT },
                    { fragment: '::', scopes: PSEUDO_ELEMENT_PREFIX },
                    { fragment: '-_weird-element', scopes: PSEUDO_ELEMENT },
                ],
            },
            {
                actual: '$$:class, :test-class, :-weird-class, :_weird-class, :-_weird-class',
                expected: [
                    { fragment: '$$', scopes: SEPARATOR },
                    { fragment: ':', scopes: PSEUDO_CLASS_PREFIX },
                    { fragment: 'class', scopes: PSEUDO_CLASS },
                    { fragment: ',', scopes: COMMA },
                    { fragment: ' ', scopes: ROOT },
                    { fragment: ':', scopes: PSEUDO_CLASS_PREFIX },
                    { fragment: 'test-class', scopes: PSEUDO_CLASS },
                    { fragment: ',', scopes: COMMA },
                    { fragment: ' ', scopes: ROOT },
                    { fragment: ':', scopes: PSEUDO_CLASS_PREFIX },
                    { fragment: '-weird-class', scopes: PSEUDO_CLASS },
                    { fragment: ',', scopes: COMMA },
                    { fragment: ' ', scopes: ROOT },
                    { fragment: ':', scopes: PSEUDO_CLASS_PREFIX },
                    { fragment: '_weird-class', scopes: PSEUDO_CLASS },
                    { fragment: ',', scopes: COMMA },
                    { fragment: ' ', scopes: ROOT },
                    { fragment: ':', scopes: PSEUDO_CLASS_PREFIX },
                    { fragment: '-_weird-class', scopes: PSEUDO_CLASS },
                ],
            },
            {
                actual: '$$:class(), :test-class(), :-weird-class(), :_weird-class(), :-_weird-class()',
                expected: [
                    { fragment: '$$', scopes: SEPARATOR },
                    { fragment: ':', scopes: PSEUDO_CLASS_PREFIX },
                    { fragment: 'class', scopes: PSEUDO_CLASS },
                    { fragment: '(', scopes: PSEUDO_CLASS_OPEN },
                    { fragment: ')', scopes: PSEUDO_CLASS_CLOSE },
                    { fragment: ',', scopes: COMMA },
                    { fragment: ' ', scopes: ROOT },
                    { fragment: ':', scopes: PSEUDO_CLASS_PREFIX },
                    { fragment: 'test-class', scopes: PSEUDO_CLASS },
                    { fragment: '(', scopes: PSEUDO_CLASS_OPEN },
                    { fragment: ')', scopes: PSEUDO_CLASS_CLOSE },
                    { fragment: ',', scopes: COMMA },
                    { fragment: ' ', scopes: ROOT },
                    { fragment: ':', scopes: PSEUDO_CLASS_PREFIX },
                    { fragment: '-weird-class', scopes: PSEUDO_CLASS },
                    { fragment: '(', scopes: PSEUDO_CLASS_OPEN },
                    { fragment: ')', scopes: PSEUDO_CLASS_CLOSE },
                    { fragment: ',', scopes: COMMA },
                    { fragment: ' ', scopes: ROOT },
                    { fragment: ':', scopes: PSEUDO_CLASS_PREFIX },
                    { fragment: '_weird-class', scopes: PSEUDO_CLASS },
                    { fragment: '(', scopes: PSEUDO_CLASS_OPEN },
                    { fragment: ')', scopes: PSEUDO_CLASS_CLOSE },
                    { fragment: ',', scopes: COMMA },
                    { fragment: ' ', scopes: ROOT },
                    { fragment: ':', scopes: PSEUDO_CLASS_PREFIX },
                    { fragment: '-_weird-class', scopes: PSEUDO_CLASS },
                    { fragment: '(', scopes: PSEUDO_CLASS_OPEN },
                    { fragment: ')', scopes: PSEUDO_CLASS_CLOSE },
                ],
            },
            {
                actual: '$$:class1(arg1), :class2("arg2"), :class3(\'arg3\'), :class4(/arg4/i)',
                expected: [
                    { fragment: '$$', scopes: SEPARATOR },
                    { fragment: ':', scopes: PSEUDO_CLASS_PREFIX },
                    { fragment: 'class1', scopes: PSEUDO_CLASS },
                    { fragment: '(', scopes: PSEUDO_CLASS_OPEN },
                    { fragment: 'arg1', scopes: PSEUDO_CLASS_UNQUOTED },
                    { fragment: ')', scopes: PSEUDO_CLASS_CLOSE },
                    { fragment: ',', scopes: COMMA },
                    { fragment: ' ', scopes: ROOT },
                    { fragment: ':', scopes: PSEUDO_CLASS_PREFIX },
                    { fragment: 'class2', scopes: PSEUDO_CLASS },
                    { fragment: '(', scopes: PSEUDO_CLASS_OPEN },
                    { fragment: '"', scopes: PSEUDO_CLASS_DOUBLE_OPEN },
                    { fragment: 'arg2', scopes: PSEUDO_CLASS_DOUBLE },
                    { fragment: '"', scopes: PSEUDO_CLASS_DOUBLE_CLOSE },
                    { fragment: ')', scopes: PSEUDO_CLASS_CLOSE },
                    { fragment: ',', scopes: COMMA },
                    { fragment: ' ', scopes: ROOT },
                    { fragment: ':', scopes: PSEUDO_CLASS_PREFIX },
                    { fragment: 'class3', scopes: PSEUDO_CLASS },
                    { fragment: '(', scopes: PSEUDO_CLASS_OPEN },
                    { fragment: '\'', scopes: PSEUDO_CLASS_SINGLE_OPEN },
                    { fragment: 'arg3', scopes: PSEUDO_CLASS_SINGLE },
                    { fragment: '\'', scopes: PSEUDO_CLASS_SINGLE_CLOSE },
                    { fragment: ')', scopes: PSEUDO_CLASS_CLOSE },
                    { fragment: ',', scopes: COMMA },
                    { fragment: ' ', scopes: ROOT },
                    { fragment: ':', scopes: PSEUDO_CLASS_PREFIX },
                    { fragment: 'class4', scopes: PSEUDO_CLASS },
                    { fragment: '(', scopes: PSEUDO_CLASS_OPEN },
                    { fragment: '/', scopes: PSEUDO_CLASS_REGEXP_OPEN },
                    { fragment: 'arg4', scopes: PSEUDO_CLASS_REGEXP },
                    { fragment: '/', scopes: PSEUDO_CLASS_REGEXP_CLOSE },
                    { fragment: 'i', scopes: PSEUDO_CLASS_REGEXP_FLAGS },
                    { fragment: ')', scopes: PSEUDO_CLASS_CLOSE },
                ],
            },
            {
                actual: '$$:class1("arg \\" 1"), :class2(\'arg \\\' 2\'), :class3(/arg\\/3/i)',
                expected: [
                    { fragment: '$$', scopes: SEPARATOR },
                    { fragment: ':', scopes: PSEUDO_CLASS_PREFIX },
                    { fragment: 'class1', scopes: PSEUDO_CLASS },
                    { fragment: '(', scopes: PSEUDO_CLASS_OPEN },
                    { fragment: '"', scopes: PSEUDO_CLASS_DOUBLE_OPEN },
                    { fragment: 'arg \\" 1', scopes: PSEUDO_CLASS_DOUBLE },
                    { fragment: '"', scopes: PSEUDO_CLASS_DOUBLE_CLOSE },
                    { fragment: ')', scopes: PSEUDO_CLASS_CLOSE },
                    { fragment: ',', scopes: COMMA },
                    { fragment: ' ', scopes: ROOT },
                    { fragment: ':', scopes: PSEUDO_CLASS_PREFIX },
                    { fragment: 'class2', scopes: PSEUDO_CLASS },
                    { fragment: '(', scopes: PSEUDO_CLASS_OPEN },
                    { fragment: '\'', scopes: PSEUDO_CLASS_SINGLE_OPEN },
                    { fragment: 'arg \\\' 2', scopes: PSEUDO_CLASS_SINGLE },
                    { fragment: '\'', scopes: PSEUDO_CLASS_SINGLE_CLOSE },
                    { fragment: ')', scopes: PSEUDO_CLASS_CLOSE },
                    { fragment: ',', scopes: COMMA },
                    { fragment: ' ', scopes: ROOT },
                    { fragment: ':', scopes: PSEUDO_CLASS_PREFIX },
                    { fragment: 'class3', scopes: PSEUDO_CLASS },
                    { fragment: '(', scopes: PSEUDO_CLASS_OPEN },
                    { fragment: '/', scopes: PSEUDO_CLASS_REGEXP_OPEN },
                    { fragment: 'arg\\/3', scopes: PSEUDO_CLASS_REGEXP },
                    { fragment: '/', scopes: PSEUDO_CLASS_REGEXP_CLOSE },
                    { fragment: 'i', scopes: PSEUDO_CLASS_REGEXP_FLAGS },
                    { fragment: ')', scopes: PSEUDO_CLASS_CLOSE },
                ],
            },
            {
                actual: '$$:class1( arg1 ), :class2( "arg2" ), :class3( \'arg3\' ), :class4( /arg4/i )',
                expected: [
                    { fragment: '$$', scopes: SEPARATOR },
                    { fragment: ':', scopes: PSEUDO_CLASS_PREFIX },
                    { fragment: 'class1', scopes: PSEUDO_CLASS },
                    { fragment: '(', scopes: PSEUDO_CLASS_OPEN },
                    { fragment: ' arg1 ', scopes: PSEUDO_CLASS_UNQUOTED },
                    { fragment: ')', scopes: PSEUDO_CLASS_CLOSE },
                    { fragment: ',', scopes: COMMA },
                    { fragment: ' ', scopes: ROOT },
                    { fragment: ':', scopes: PSEUDO_CLASS_PREFIX },
                    { fragment: 'class2', scopes: PSEUDO_CLASS },
                    { fragment: '(', scopes: PSEUDO_CLASS_OPEN },
                    { fragment: ' ', scopes: PSEUDO_CLASS },
                    { fragment: '"', scopes: PSEUDO_CLASS_DOUBLE_OPEN },
                    { fragment: 'arg2', scopes: PSEUDO_CLASS_DOUBLE },
                    { fragment: '"', scopes: PSEUDO_CLASS_DOUBLE_CLOSE },
                    { fragment: ' ', scopes: PSEUDO_CLASS },
                    { fragment: ')', scopes: PSEUDO_CLASS_CLOSE },
                    { fragment: ',', scopes: COMMA },
                    { fragment: ' ', scopes: ROOT },
                    { fragment: ':', scopes: PSEUDO_CLASS_PREFIX },
                    { fragment: 'class3', scopes: PSEUDO_CLASS },
                    { fragment: '(', scopes: PSEUDO_CLASS_OPEN },
                    { fragment: ' ', scopes: PSEUDO_CLASS },
                    { fragment: '\'', scopes: PSEUDO_CLASS_SINGLE_OPEN },
                    { fragment: 'arg3', scopes: PSEUDO_CLASS_SINGLE },
                    { fragment: '\'', scopes: PSEUDO_CLASS_SINGLE_CLOSE },
                    { fragment: ' ', scopes: PSEUDO_CLASS },
                    { fragment: ')', scopes: PSEUDO_CLASS_CLOSE },
                    { fragment: ',', scopes: COMMA },
                    { fragment: ' ', scopes: ROOT },
                    { fragment: ':', scopes: PSEUDO_CLASS_PREFIX },
                    { fragment: 'class4', scopes: PSEUDO_CLASS },
                    { fragment: '(', scopes: PSEUDO_CLASS_OPEN },
                    { fragment: ' ', scopes: PSEUDO_CLASS },
                    { fragment: '/', scopes: PSEUDO_CLASS_REGEXP_OPEN },
                    { fragment: 'arg4', scopes: PSEUDO_CLASS_REGEXP },
                    { fragment: '/', scopes: PSEUDO_CLASS_REGEXP_CLOSE },
                    { fragment: 'i', scopes: PSEUDO_CLASS_REGEXP_FLAGS },
                    { fragment: ' ', scopes: PSEUDO_CLASS },
                    { fragment: ')', scopes: PSEUDO_CLASS_CLOSE },
                ],
            },
            {
                actual: '$$:class(arg with spaces), :class(multiple, args, here)',
                expected: [
                    { fragment: '$$', scopes: SEPARATOR },
                    { fragment: ':', scopes: PSEUDO_CLASS_PREFIX },
                    { fragment: 'class', scopes: PSEUDO_CLASS },
                    { fragment: '(', scopes: PSEUDO_CLASS_OPEN },
                    { fragment: 'arg with spaces', scopes: PSEUDO_CLASS_UNQUOTED },
                    { fragment: ')', scopes: PSEUDO_CLASS_CLOSE },
                    { fragment: ',', scopes: COMMA },
                    { fragment: ' ', scopes: ROOT },
                    { fragment: ':', scopes: PSEUDO_CLASS_PREFIX },
                    { fragment: 'class', scopes: PSEUDO_CLASS },
                    { fragment: '(', scopes: PSEUDO_CLASS_OPEN },
                    { fragment: 'multiple, args, here', scopes: PSEUDO_CLASS_UNQUOTED },
                    { fragment: ')', scopes: PSEUDO_CLASS_CLOSE },
                ],
            },
            {
                actual: '$$tag > tag + tag ~ tag tag, tag + tag',
                expected: [
                    { fragment: '$$', scopes: SEPARATOR },
                    { fragment: 'tag', scopes: TYPE_SELECTOR },
                    { fragment: ' ', scopes: ROOT },
                    { fragment: '>', scopes: COMBINATOR },
                    { fragment: ' ', scopes: ROOT },
                    { fragment: 'tag', scopes: TYPE_SELECTOR },
                    { fragment: ' ', scopes: ROOT },
                    { fragment: '+', scopes: COMBINATOR },
                    { fragment: ' ', scopes: ROOT },
                    { fragment: 'tag', scopes: TYPE_SELECTOR },
                    { fragment: ' ', scopes: ROOT },
                    { fragment: '~', scopes: COMBINATOR },
                    { fragment: ' ', scopes: ROOT },
                    { fragment: 'tag', scopes: TYPE_SELECTOR },
                    { fragment: ' ', scopes: COMBINATOR },
                    { fragment: 'tag', scopes: TYPE_SELECTOR },
                    { fragment: ',', scopes: COMMA },
                    { fragment: ' ', scopes: ROOT },
                    { fragment: 'tag', scopes: TYPE_SELECTOR },
                    { fragment: ' ', scopes: ROOT },
                    { fragment: '+', scopes: COMBINATOR },
                    { fragment: ' ', scopes: ROOT },
                    { fragment: 'tag', scopes: TYPE_SELECTOR },
                ],
            },
        ])("should tokenize valid HTML filtering rule '$actual'", ({ actual, expected }) => {
            expect(actual).toBeTokenizedProperly(
                tokenizer,
                expected,
            );
        });
    });

    describe('HTML filtering rule - invalid cases', () => {
        test.each([
            {
                actual: '$$',
                expected: [
                    { fragment: '$', scopes: SEPARATOR },
                    { fragment: '$', scopes: ['text.adblock', 'invalid.illegal.redundant.modifier.separator'] },
                ],
            },
            {
                actual: '$$1tag',
                expected: [
                    { fragment: '$$', scopes: SEPARATOR },
                    { fragment: '1tag', scopes: INVALID },
                ],
            },
            {
                actual: '$$-1tag',
                expected: [
                    { fragment: '$$', scopes: SEPARATOR },
                    { fragment: '-1tag', scopes: INVALID },
                ],
            },
            {
                actual: '$$#',
                expected: [
                    { fragment: '$$', scopes: SEPARATOR },
                    { fragment: '#', scopes: INVALID },
                ],
            },
            {
                actual: '$$#1id',
                expected: [
                    { fragment: '$$', scopes: SEPARATOR },
                    { fragment: '#1id', scopes: INVALID },
                ],
            },
            {
                actual: '$$#-1id',
                expected: [
                    { fragment: '$$', scopes: SEPARATOR },
                    { fragment: '#-1id', scopes: INVALID },
                ],
            },
            {
                actual: '$$.',
                expected: [
                    { fragment: '$$', scopes: SEPARATOR },
                    { fragment: '.', scopes: INVALID },
                ],
            },
            {
                actual: '$$.1class',
                expected: [
                    { fragment: '$$', scopes: SEPARATOR },
                    { fragment: '.1class', scopes: INVALID },
                ],
            },
            {
                actual: '$$.-1class',
                expected: [
                    { fragment: '$$', scopes: SEPARATOR },
                    { fragment: '.-1class', scopes: INVALID },
                ],
            },
            {
                actual: '$$[',
                expected: [
                    { fragment: '$$', scopes: SEPARATOR },
                    { fragment: '[', scopes: INVALID },
                ],
            },
            {
                actual: '$$[]',
                expected: [
                    { fragment: '$$', scopes: SEPARATOR },
                    { fragment: '[]', scopes: INVALID },
                ],
            },
            {
                actual: '$$[1attr]',
                expected: [
                    { fragment: '$$', scopes: SEPARATOR },
                    { fragment: '[1attr]', scopes: INVALID },
                ],
            },
            {
                actual: '$$[-1attr]',
                expected: [
                    { fragment: '$$', scopes: SEPARATOR },
                    { fragment: '[-1attr]', scopes: INVALID },
                ],
            },
            {
                actual: '$$[invalid attr]',
                expected: [
                    { fragment: '$$', scopes: SEPARATOR },
                    { fragment: '[invalid attr]', scopes: INVALID },
                ],
            },
            {
                actual: '$$[attr=]',
                expected: [
                    { fragment: '$$', scopes: SEPARATOR },
                    { fragment: '[attr=]', scopes: INVALID },
                ],
            },
            {
                actual: '$$[attr="unclosed value]',
                expected: [
                    { fragment: '$$', scopes: SEPARATOR },
                    { fragment: '[attr="unclosed value]', scopes: INVALID },
                ],
            },
            {
                actual: '$$[attr=value with spaces]',
                expected: [
                    { fragment: '$$', scopes: SEPARATOR },
                    { fragment: '[attr=value with spaces]', scopes: INVALID },
                ],
            },
            {
                actual: '$$[attr+="invalid operator"]',
                expected: [
                    { fragment: '$$', scopes: SEPARATOR },
                    { fragment: '[attr+="invalid operator"]', scopes: INVALID },
                ],
            },
            {
                actual: '$$[attr="unescaped " quote"]',
                expected: [
                    { fragment: '$$', scopes: SEPARATOR },
                    { fragment: '[attr="unescaped " quote"]', scopes: INVALID },
                ],
            },
            {
                actual: '$$::',
                expected: [
                    { fragment: '$$', scopes: SEPARATOR },
                    { fragment: '::', scopes: INVALID },
                ],
            },
            {
                actual: '$$::1element',
                expected: [
                    { fragment: '$$', scopes: SEPARATOR },
                    { fragment: '::1element', scopes: INVALID },
                ],
            },
            {
                actual: '$$::-1element',
                expected: [
                    { fragment: '$$', scopes: SEPARATOR },
                    { fragment: '::-1element', scopes: INVALID },
                ],
            },
            {
                actual: '$$::element()',
                expected: [
                    { fragment: '$$', scopes: SEPARATOR },
                    { fragment: '::', scopes: PSEUDO_ELEMENT_PREFIX },
                    { fragment: 'element', scopes: PSEUDO_ELEMENT },
                    { fragment: '()', scopes: INVALID },
                ],
            },
            {
                actual: '$$:',
                expected: [
                    { fragment: '$$', scopes: SEPARATOR },
                    { fragment: ':', scopes: INVALID },
                ],
            },
            {
                actual: '$$:1class',
                expected: [
                    { fragment: '$$', scopes: SEPARATOR },
                    { fragment: ':1class', scopes: INVALID },
                ],
            },
            {
                actual: '$$:-1class',
                expected: [
                    { fragment: '$$', scopes: SEPARATOR },
                    { fragment: ':-1class', scopes: INVALID },
                ],
            },
            {
                actual: '$$:1class()',
                expected: [
                    { fragment: '$$', scopes: SEPARATOR },
                    { fragment: ':1class()', scopes: INVALID },
                ],
            },
            {
                actual: '$$:-1class()',
                expected: [
                    { fragment: '$$', scopes: SEPARATOR },
                    { fragment: ':-1class()', scopes: INVALID },
                ],
            },
            {
                actual: '$$:class("unclosed arg',
                expected: [
                    { fragment: '$$', scopes: SEPARATOR },
                    { fragment: ':', scopes: PSEUDO_CLASS_PREFIX },
                    { fragment: 'class', scopes: PSEUDO_CLASS },
                    { fragment: '("unclosed arg', scopes: INVALID },
                ],
            },
        ])("should detect invalid HTML filtering rule '$actual'", ({ actual, expected }) => {
            expect(actual).toBeTokenizedProperly(
                tokenizer,
                expected,
            );
        });
    });
});
