// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MedToken
 * @notice Med+ DeSci platformunun yerli tokeni.
 *
 * Token Ekonomisi (Tokenomics):
 *   - Toplam arz       : 1,000,000 MED
 *   - Deploy anında    : Tüm tokenlar owner (backend cüzdanı) adresine mint edilir.
 *   - Dağıtım          : Backend, reward() fonksiyonu aracılığıyla doktorlara ödül gönderir.
 *
 * Ödül Tablosu:
 *   +5  MED  → Doğrula (her 5 doğrulamada)
 *   +50 MED  → Nadir Vaka Bonusu (3 Nadir oyu)
 *   +5  MED  → Hekime Teşekkür Et (alan taraf)
 *   -5  MED  → Hekime Teşekkür Et (gönderen taraf)
 */
contract MedToken is ERC20, Ownable {

    // ─── Sabitler ───────────────────────────────────────────────
    uint256 public constant INITIAL_SUPPLY = 1_000_000 * 10 ** 18;

    // ─── Events ─────────────────────────────────────────────────
    /// @notice Backend her ödül gönderdiğinde bu event fırlar.
    /// Testnet explorer'da görünür → sunum için ideal.
    event RewardSent(
        address indexed recipient,
        uint256 amount,
        string  reason
    );

    // ─── Constructor ─────────────────────────────────────────────
    /// @dev Deploy eden adres hem owner hem de tüm token bakiyesini alır.
    constructor() ERC20("MedToken", "MED") Ownable(msg.sender) {
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    // ─── Owner-Only Functions ────────────────────────────────────

    /**
     * @notice Backend bir doktora ödül göndermek istediğinde çağırır.
     * @dev Owner cüzdanından alıcıya transfer eder. msg.sender == owner şartı aranır.
     * @param to      Ödül alacak doktorun MetaMask adresi
     * @param amount  Gönderilecek token miktarı (wei cinsinden, 18 decimal)
     *                Örnek: 5 MED göndermek için → 5 * 10**18 = 5000000000000000000
     * @param reason  Loglama için neden (ör. "validation_milestone", "rare_case_bonus")
     */
    function reward(
        address to,
        uint256 amount,
        string calldata reason
    ) external onlyOwner {
        require(to != address(0), "MedToken: Gecersiz hedef adres");
        require(to != owner(), "MedToken: Kendine odul gonderemezsiniz");
        require(
            balanceOf(owner()) >= amount,
            "MedToken: Owner bakiyesi yetersiz"
        );

        _transfer(owner(), to, amount);
        emit RewardSent(to, amount, reason);
    }

    // ─── View Helpers (Frontend için) ────────────────────────────

    /**
     * @notice Bir adresin token bakiyesini tam sayı olarak döndürür (18 decimal olmadan).
     * @dev Frontend UI'da "450 MED" göstermek için kullanılır.
     *      Gerçek bakiye = balanceOf() / 10**18
     */
    function balanceOfMED(address account) external view returns (uint256) {
        return balanceOf(account) / 10 ** 18;
    }

    /**
     * @notice Owner'ın (backend cüzdanının) kalan ödül havuzunu tam sayı olarak döndürür.
     */
    function rewardPool() external view returns (uint256) {
        return balanceOf(owner()) / 10 ** 18;
    }
}
